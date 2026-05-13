import React, { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ExternalLink, Camera, MapPin, Mic, Image, Users, Copy } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LinkHistory = ({ onBack, onViewDetails }) => {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      const response = await axios.get(`${API}/demo-links`);
      setLinks(response.data);
    } catch (error) {
      console.error("Error fetching links:", error);
      toast.error("Failed to fetch link history");
    } finally {
      setLoading(false);
    }
  };

  const permissionIcons = {
    camera: Camera,
    location: MapPin,
    microphone: Mic,
    photos: Image,
    contacts: Users,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={onBack}
            data-testid="back-btn"
            size="icon"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Link History</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto space-y-6">
          {links.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <p className="text-gray-500 mb-4">No links generated yet</p>
                <Button onClick={onBack} className="bg-indigo-600 hover:bg-indigo-700">Generate Your First Link</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {links.map((link) => {
                const demoUrl = `${BACKEND_URL}/${link.demo_code}`;

                const handleCopy = () => {
                  if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(demoUrl).then(
                      () => toast.success("Link copied!"),
                      () => toast.error("Failed to copy")
                    );
                  } else {
                    toast.error("Clipboard not available");
                  }
                };

                return (
                  <Card key={link.id} className="shadow-lg hover:shadow-xl transition-shadow" data-testid={`link-card-${link.demo_code}`}>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span className="truncate">Code: {link.demo_code}</span>
                        <span className="text-sm font-normal text-gray-500">
                          {link.visits} visits
                        </span>
                      </CardTitle>
                      <CardDescription className="break-all">
                        {link.original_url}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">
                          Demo Link
                        </label>
                        <p className="text-xs font-mono break-all text-indigo-700 bg-indigo-50 p-2 rounded border border-indigo-100" data-testid={`demo-link-${link.demo_code}`}>
                          {demoUrl}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Permissions
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {link.permissions.map((perm) => {
                            const Icon = permissionIcons[perm];
                            return (
                              <div
                                key={perm}
                                className="flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium"
                              >
                                {Icon && <Icon className="h-3 w-3" />}
                                <span className="capitalize">{perm}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => onViewDetails(link.demo_code)}
                          className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                          size="sm"
                          data-testid={`view-details-${link.demo_code}`}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                        <Button
                          onClick={handleCopy}
                          variant="outline"
                          size="sm"
                          data-testid={`copy-link-${link.demo_code}`}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>

                      <p className="text-xs text-gray-500">
                        Created: {new Date(link.created_at).toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default LinkHistory;