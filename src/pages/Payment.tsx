import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CheckCircle, CreditCard, Calendar, MapPin, Users } from "lucide-react";
import { toast } from "sonner";

const Payment = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<any>(null);
  const [route, setRoute] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchBookingDetails();
  }, [id]);

  const fetchBookingDetails = async () => {
    try {
      const { data: bookingData, error: bookingError } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", id)
        .single();

      if (bookingError) throw bookingError;

      const { data: routeData, error: routeError } = await supabase
        .from("bus_routes")
        .select("*")
        .eq("id", bookingData.route_id)
        .single();

      if (routeError) throw routeError;

      setBooking(bookingData);
      setRoute(routeData);
    } catch (error: any) {
      toast.error("Failed to load booking details");
      console.error("Error:", error);
      navigate("/bookings");
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    setProcessing(true);

    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const { error } = await supabase
        .from("bookings")
        .update({ payment_status: "completed" })
        .eq("id", id);

      if (error) throw error;

      toast.success("Payment successful!");
      navigate("/bookings");
    } catch (error: any) {
      toast.error("Payment failed. Please try again.");
      console.error("Error:", error);
    } finally {
      setProcessing(false);
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

  if (!booking || !route) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Booking not found</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-6">
            <Link to="/bookings" className="text-sm text-muted-foreground hover:text-primary">
              ← Back to Bookings
            </Link>
          </div>

          <h1 className="text-3xl font-bold mb-8">Complete Payment</h1>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              {/* Booking Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Booking Details</CardTitle>
                  <CardDescription>Review your booking information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">{route.route_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {route.origin} → {route.destination}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">
                        {new Date(booking.journey_date).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Departure: {booking.departure_time}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">
                        {booking.seat_numbers.length} Seat(s)
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Seats: {booking.seat_numbers.join(", ")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Method</CardTitle>
                  <CardDescription>Select your preferred payment method</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-4 border rounded-lg bg-primary/5 border-primary">
                      <CreditCard className="h-5 w-5 text-primary" />
                      <div className="flex-1">
                        <p className="font-medium">Credit/Debit Card</p>
                        <p className="text-sm text-muted-foreground">
                          Secure payment via card
                        </p>
                      </div>
                      <Badge>Selected</Badge>
                    </div>

                    <div className="flex items-center justify-center gap-2 p-4 bg-muted/50 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-success" />
                      <p className="text-sm text-muted-foreground">
                        Your payment is secured with 256-bit SSL encryption
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payment Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Payment Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Ticket Price:</span>
                      <span className="font-medium">
                        ${(booking.total_amount / booking.seat_numbers.length).toFixed(2)} × {booking.seat_numbers.length}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span className="font-medium">${booking.total_amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Service Fee:</span>
                      <span className="font-medium">$0.00</span>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-lg">Total Amount:</span>
                      <span className="text-2xl font-bold text-primary">
                        ${booking.total_amount.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handlePayment}
                    disabled={processing || booking.payment_status === "completed"}
                  >
                    {processing ? (
                      <>Processing...</>
                    ) : booking.payment_status === "completed" ? (
                      <>Payment Completed</>
                    ) : (
                      <>Pay ${booking.total_amount.toFixed(2)}</>
                    )}
                  </Button>

                  {booking.payment_status === "completed" && (
                    <div className="flex items-center gap-2 text-sm text-success bg-success/10 p-3 rounded-lg">
                      <CheckCircle className="h-4 w-4" />
                      <span>Payment completed successfully</span>
                    </div>
                  )}
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

export default Payment;
