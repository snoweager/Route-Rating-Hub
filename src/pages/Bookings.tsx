import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { MapPin, Calendar, Star, CheckCircle, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Booking {
  id: string;
  journey_date: string;
  departure_time: string;
  seat_numbers: string[];
  total_amount: number;
  payment_status: string;
  booking_status: string;
  created_at: string;
  bus_routes: {
    id: string;
    route_number: string;
    route_name: string;
    origin: string;
    destination: string;
  };
}

const Bookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewBookingId, setReviewBookingId] = useState<string | null>(null);
  const [reviewData, setReviewData] = useState({
    rating: 5,
    title: "",
    comment: "",
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Please sign in to view bookings");
      navigate("/auth");
      return;
    }
    fetchBookings(session.user.id);
  };

  const fetchBookings = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          bus_routes (
            id,
            route_number,
            route_name,
            origin,
            destination
          )
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error: any) {
      toast.error("Failed to load bookings");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const booking = bookings.find(b => b.id === reviewBookingId);
      if (!booking) return;

      const { error } = await supabase.from("reviews").insert({
        route_id: booking.bus_routes.id,
        user_id: session.user.id,
        booking_id: reviewBookingId,
        rating: reviewData.rating,
        title: reviewData.title,
        comment: reviewData.comment,
      });

      if (error) throw error;

      toast.success("Review submitted successfully!");
      setReviewBookingId(null);
      setReviewData({ rating: 5, title: "", comment: "" });
    } catch (error: any) {
      if (error.message.includes("duplicate")) {
        toast.error("You've already reviewed this journey");
      } else {
        toast.error("Failed to submit review");
      }
      console.error("Error:", error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-success" />;
      case "cancelled":
        return <XCircle className="h-5 w-5 text-destructive" />;
      default:
        return <Clock className="h-5 w-5 text-warning" />;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-success">{status}</Badge>;
      case "pending":
        return <Badge variant="outline" className="border-warning text-warning">{status}</Badge>;
      default:
        return <Badge variant="destructive">{status}</Badge>;
    }
  };

  const canReview = (booking: Booking) => {
    const journeyDate = new Date(booking.journey_date);
    const today = new Date();
    return journeyDate < today && booking.booking_status === "confirmed" && booking.payment_status === "completed";
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading bookings...</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">My Bookings</h1>
            <p className="text-muted-foreground">
              Manage your bus bookings and leave reviews for completed journeys
            </p>
          </div>

          {bookings.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <p className="text-muted-foreground mb-4">You don't have any bookings yet</p>
                <Link to="/routes">
                  <Button>Browse Routes</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {bookings.map((booking) => (
                <Card key={booking.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <CardTitle className="text-xl">{booking.bus_routes.route_name}</CardTitle>
                          <Badge variant="secondary">{booking.bus_routes.route_number}</Badge>
                        </div>
                        <CardDescription className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {booking.bus_routes.origin} → {booking.bus_routes.destination}
                        </CardDescription>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {getPaymentStatusBadge(booking.payment_status)}
                        <div className="flex items-center gap-2">
                          {getStatusIcon(booking.booking_status)}
                          <span className="text-sm capitalize">{booking.booking_status}</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Journey Date</p>
                          <p className="font-medium">
                            {new Date(booking.journey_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Departure Time</p>
                          <p className="font-medium">{booking.departure_time}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground">Seats</p>
                        <p className="font-medium">{booking.seat_numbers.join(", ")}</p>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground">Total Amount</p>
                        <p className="text-lg font-bold text-primary">
                          ${booking.total_amount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="flex gap-3">
                    <Link to={`/routes/${booking.bus_routes.id}`}>
                      <Button variant="outline">View Route</Button>
                    </Link>

                    {booking.payment_status === "pending" && (
                      <Link to={`/payment/${booking.id}`}>
                        <Button>Complete Payment</Button>
                      </Link>
                    )}

                    {canReview(booking) && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            onClick={() => setReviewBookingId(booking.id)}
                          >
                            <Star className="mr-2 h-4 w-4" />
                            Leave Review
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Review Your Journey</DialogTitle>
                            <DialogDescription>
                              Share your experience with {booking.bus_routes.route_name}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label>Rating</Label>
                              <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() => setReviewData({ ...reviewData, rating: star })}
                                    className="transition-transform hover:scale-110"
                                  >
                                    <Star
                                      className={`h-8 w-8 ${
                                        star <= reviewData.rating
                                          ? "fill-yellow-400 text-yellow-400"
                                          : "text-gray-300"
                                      }`}
                                    />
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="title">Review Title</Label>
                              <input
                                id="title"
                                type="text"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={reviewData.title}
                                onChange={(e) => setReviewData({ ...reviewData, title: e.target.value })}
                                placeholder="Summarize your experience"
                                required
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="comment">Your Review</Label>
                              <Textarea
                                id="comment"
                                value={reviewData.comment}
                                onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                                placeholder="Share details about your journey..."
                                rows={4}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              onClick={handleSubmitReview}
                              disabled={!reviewData.title}
                            >
                              Submit Review
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Bookings;
