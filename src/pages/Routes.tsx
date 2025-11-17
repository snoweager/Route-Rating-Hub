import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { MapPin, Clock, DollarSign, Star, Search } from "lucide-react";
import { toast } from "sonner";

interface BusRoute {
  id: string;
  route_number: string;
  route_name: string;
  origin: string;
  destination: string;
  duration_minutes: number;
  price: number;
  amenities: string[];
  description: string;
}

interface RouteWithRating extends BusRoute {
  average_rating?: number;
  review_count?: number;
}

const Routes = () => {
  const [routes, setRoutes] = useState<RouteWithRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      const { data: routesData, error: routesError } = await supabase
        .from("bus_routes")
        .select("*")
        .order("route_number");

      if (routesError) throw routesError;

      // Fetch ratings for each route
      const routesWithRatings = await Promise.all(
        (routesData || []).map(async (route) => {
          const { data: reviews } = await supabase
            .from("reviews")
            .select("rating")
            .eq("route_id", route.id);

          const reviewCount = reviews?.length || 0;
          const averageRating = reviewCount > 0
            ? reviews!.reduce((sum, r) => sum + r.rating, 0) / reviewCount
            : 0;

          return {
            ...route,
            average_rating: averageRating,
            review_count: reviewCount,
          };
        })
      );

      setRoutes(routesWithRatings);
    } catch (error: any) {
      toast.error("Failed to load routes");
      console.error("Error fetching routes:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRoutes = routes.filter((route) =>
    route.route_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    route.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
    route.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
    route.route_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">Available Routes</h1>
            <p className="text-muted-foreground mb-6">
              Browse our extensive network of bus routes and find your perfect journey
            </p>

            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search routes, cities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading routes...</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredRoutes.map((route) => (
                <Card key={route.id} className="flex flex-col hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="secondary">{route.route_number}</Badge>
                      {route.review_count! > 0 && (
                        <div className="flex items-center gap-1 text-sm">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{route.average_rating?.toFixed(1)}</span>
                          <span className="text-muted-foreground">({route.review_count})</span>
                        </div>
                      )}
                    </div>
                    <CardTitle className="text-xl">{route.route_name}</CardTitle>
                    <CardDescription>{route.description}</CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1 space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {route.origin} → {route.destination}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{Math.floor(route.duration_minutes / 60)}h {route.duration_minutes % 60}m</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold text-lg">${route.price.toFixed(2)}</span>
                    </div>

                    {route.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {route.amenities.slice(0, 3).map((amenity) => (
                          <Badge key={amenity} variant="outline" className="text-xs">
                            {amenity}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>

                  <CardFooter>
                    <Link to={`/routes/${route.id}`} className="w-full">
                      <Button className="w-full">View Details</Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}

          {!loading && filteredRoutes.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No routes found matching your search.</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Routes;
