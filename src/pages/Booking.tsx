import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Calendar, Clock, MapPin, User, Mail, Phone } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const bookingSchema = z.object({
  passengerName: z.string().min(2, "Name must be at least 2 characters").max(100),
  passengerEmail: z.string().email("Invalid email address").max(255),
  passengerPhone: z.string().min(10, "Phone number must be at least 10 digits").max(20),
  journeyDate: z.string().min(1, "Please select a date"),
  departureTime: z.string().min(1, "Please select a departure time"),
});

const Booking = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [route, setRoute] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [formData, setFormData] = useState({
    passengerName: "",
    passengerEmail: "",
    passengerPhone: "",
    journeyDate: "",
    departureTime: "",
  });
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
    fetchRouteDetails();
  }, [id]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Please sign in to make a booking");
      navigate("/auth");
      return;
    }
    setUserId(session.user.id);

    // Pre-fill form with user data
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (profile) {
      setFormData((prev) => ({
        ...prev,
        passengerName: profile.full_name || "",
        passengerEmail: session.user.email || "",
        passengerPhone: profile.phone || "",
      }));
    }
  };

  const fetchRouteDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("bus_routes")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setRoute(data);
    } catch (error: any) {
      toast.error("Failed to load route details");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSeat = (seatNumber: number) => {
    setSelectedSeats((prev) =>
      prev.includes(seatNumber)
        ? prev.filter((s) => s !== seatNumber)
        : [...prev, seatNumber]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedSeats.length === 0) {
      toast.error("Please select at least one seat");
      return;
    }

    try {
      // Validate form data
      const validatedData = bookingSchema.parse(formData);

      const totalAmount = route.price * selectedSeats.length;

      const { data: booking, error } = await supabase
        .from("bookings")
        .insert({
          user_id: userId,
          route_id: id,
          journey_date: validatedData.journeyDate,
          departure_time: validatedData.departureTime,
          seat_numbers: selectedSeats.map(String),
          passenger_name: validatedData.passengerName,
          passenger_phone: validatedData.passengerPhone,
          passenger_email: validatedData.passengerEmail,
          total_amount: totalAmount,
          payment_status: "pending",
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Booking created successfully!");
      navigate(`/payment/${booking.id}`);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("Failed to create booking");
        console.error("Error:", error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!route) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Route not found</p>
        </main>
        <Footer />
      </div>
    );
  }

  const totalAmount = route.price * selectedSeats.length;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8">Complete Your Booking</h1>

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              {/* Route Info */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{route.route_name}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-2">
                        <MapPin className="h-4 w-4" />
                        {route.origin} → {route.destination}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">{route.route_number}</Badge>
                  </div>
                </CardHeader>
              </Card>

              {/* Passenger Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Passenger Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name *</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="name"
                            value={formData.passengerName}
                            onChange={(e) => setFormData({ ...formData, passengerName: e.target.value })}
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="email"
                            type="email"
                            value={formData.passengerEmail}
                            onChange={(e) => setFormData({ ...formData, passengerEmail: e.target.value })}
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone *</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="phone"
                            type="tel"
                            value={formData.passengerPhone}
                            onChange={(e) => setFormData({ ...formData, passengerPhone: e.target.value })}
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="date">Journey Date *</Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="date"
                            type="date"
                            min={new Date().toISOString().split("T")[0]}
                            value={formData.journeyDate}
                            onChange={(e) => setFormData({ ...formData, journeyDate: e.target.value })}
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="time">Departure Time *</Label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <select
                            id="time"
                            value={formData.departureTime}
                            onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
                            className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            required
                          >
                            <option value="">Select departure time</option>
                            {route.departure_times.map((time: string) => (
                              <option key={time} value={time}>
                                {time}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Seat Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Select Seats</CardTitle>
                  <CardDescription>
                    Selected: {selectedSeats.length} seat(s)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-5 gap-3">
                    {Array.from({ length: route.total_seats }, (_, i) => i + 1).map((seatNumber) => (
                      <Button
                        key={seatNumber}
                        type="button"
                        variant={selectedSeats.includes(seatNumber) ? "default" : "outline"}
                        className="h-12"
                        onClick={() => toggleSeat(seatNumber)}
                      >
                        {seatNumber}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Booking Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Booking Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Price per seat:</span>
                      <span className="font-medium">${route.price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Selected seats:</span>
                      <span className="font-medium">{selectedSeats.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Seats:</span>
                      <span className="font-medium">
                        {selectedSeats.length > 0 ? selectedSeats.join(", ") : "None"}
                      </span>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between">
                      <span className="font-semibold">Total Amount:</span>
                      <span className="text-2xl font-bold text-primary">
                        ${totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleSubmit}
                    disabled={selectedSeats.length === 0}
                  >
                    Proceed to Payment
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Booking;
