import React, { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, ExternalLink, Copy, Camera, MapPin, Mic } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const FRONTEND_URL = window.location.origin;

const Dashboard = () => {
  const [demoLinks, setDemoLinks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDemoLinks();
  }, []);

  const fetchDemoLinks = async () => {
    try {
      const response = await axios.get(`${API}/demo-links`);
      setDemoLinks(response.data);
    } catch (error) {
      console.error("Error fetching demo links:", error);
      toast.error("Failed to fetch demo links");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const permissionIcons = {
    camera: Camera,
    location: MapPin,
    microphone: Mic,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-900">Permission Demo Dashboard</h1>
          </div>
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/")}
            data-testid="back-home-btn"
          >
            Back to Home
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-gray-900">Generated Demo Links</h2>
            <p className="text-gray-600">View and manage all your permission demo links</p>
          </div>

          {demoLinks.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <p className="text-gray-500 mb-4">No demo links generated yet</p>
                <Button onClick={() => (window.location.href = "/")} data-testid="create-first-link-btn">
                  Create Your First Demo Link
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {demoLinks.map((link) => {
                // Create demo URL that looks like original
                let demoUrl;
                try {
                  const parsed = new URL(link.original_url);
                  const pathPart = parsed.pathname.replace(/^\//, '') || 'page';
                  demoUrl = `${FRONTEND_URL}/l/${link.demo_code}/${pathPart}`;
                } catch {
                  demoUrl = `${FRONTEND_URL}/l/${link.demo_code}`;
                }
                return (
                  <Card key={link.id} className="shadow-lg hover:shadow-xl transition-shadow" data-testid={`demo-link-card-${link.demo_code}`}>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span className="truncate">Demo: {link.demo_code}</span>
                        <span className="text-sm font-normal text-gray-500">
                          {link.visits} visits
                        </span>
                      </CardTitle>
                      <CardDescription className="break-all">
                        {link.original_url}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Permissions */}
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

                      {/* Demo URL */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Demo URL
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={demoUrl}
                            readOnly
                            className="flex-1 px-3 py-2 border rounded-md bg-gray-50 text-sm font-mono"
                          />
                          <Button
                            onClick={() => copyToClipboard(demoUrl)}
                            variant="outline"
                            size="icon"
                            data-testid={`copy-demo-link-${link.demo_code}`}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          onClick={() => window.open(demoUrl, '_blank')}
                          className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                          size="sm"
                          data-testid={`open-demo-link-${link.demo_code}`}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open Demo
                        </Button>
                      </div>

                      {/* Created Date */}
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

export default Dashboard;