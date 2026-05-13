import React, { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Copy, Link as LinkIcon, Camera, MapPin, Mic, Shield, AlertCircle, Search, MoreVertical, Image, Video, Users } from "lucide-react";
import { toast } from "sonner";
import DetailsView from "@/components/DetailsView";
import LinkHistory from "@/components/LinkHistory";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Home = () => {
  const [url, setUrl] = useState("");
  const [permissions, setPermissions] = useState({
    camera: false,
    location: false,
    microphone: false,
    photos: false,
    contacts: false,
  });
  const [generatedLink, setGeneratedLink] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedCode, setSelectedCode] = useState(null);

  const handlePermissionToggle = (permission) => {
    setPermissions((prev) => ({
      ...prev,
      [permission]: !prev[permission],
    }));
  };

  const handleGenerateLink = async () => {
    if (!url) {
      toast.error("Please enter a URL");
      return;
    }

    const selectedPermissions = Object.keys(permissions).filter(
      (key) => permissions[key]
    );

    if (selectedPermissions.length === 0) {
      toast.error("Please select at least one permission");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/demo-links`, {
        original_url: url,
        permissions: selectedPermissions,
      });

      setGeneratedLink(response.data);
      toast.success("Demo link generated successfully!");
    } catch (error) {
      console.error("Error generating link:", error);
      toast.error("Failed to generate demo link");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        toast.success("Copied to clipboard!");
      }).catch((err) => {
        console.error('Failed to copy:', err);
        fallbackCopyTextToClipboard(text);
      });
    } else {
      fallbackCopyTextToClipboard(text);
    }
  };

  const fallbackCopyTextToClipboard = (text) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      toast.success("Copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy to clipboard");
    }
    
    document.body.removeChild(textArea);
  };

  const handleViewDetails = (code = null) => {
    setSelectedCode(code);
    setShowDetails(true);
    setShowHistory(false);
  };

  const handleViewHistory = () => {
    setShowHistory(true);
    setShowDetails(false);
  };

  const permissionOptions = [
    {
      id: "camera",
      label: "Camera Access",
      description: "Request camera permission",
      icon: Camera,
    },
    {
      id: "location",
      label: "Location Access",
      description: "Request geolocation permission",
      icon: MapPin,
    },
    {
      id: "microphone",
      label: "Microphone Access",
      description: "Request microphone permission",
      icon: Mic,
    },
    {
      id: "photos",
      label: "Photos & Videos",
      description: "Access photos and videos (Mobile only)",
      icon: Image,
    },
    {
      id: "contacts",
      label: "Contacts",
      description: "Access contacts (Mobile only)",
      icon: Users,
    },
  ];

  if (showDetails) {
    return <DetailsView onBack={() => setShowDetails(false)} initialCode={selectedCode} />;
  }

  if (showHistory) {
    return <LinkHistory onBack={() => setShowHistory(false)} onViewDetails={handleViewDetails} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-900">Permission Demo</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => handleViewDetails()}
              data-testid="view-details-btn"
              className="flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              View Details
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  data-testid="menu-btn"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleViewHistory} className="cursor-pointer" data-testid="link-history-btn">
                  Link History
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900">
              Educational Permission Demo
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Learn how browser permissions work by creating demo links that
              demonstrate camera, location, and microphone access requests.
            </p>
          </div>

          {/* Educational Alert */}
          <Card className="border-indigo-200 bg-indigo-50/50">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-indigo-900">
                    Educational Purpose Only
                  </p>
                  <p className="text-sm text-indigo-700">
                    This tool demonstrates how web browsers request and handle
                    permissions. All requests require explicit user consent, and no
                    data is stored without permission.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Generator Card */}
          <Card className="shadow-lg border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5" />
                Generate Demo Link
              </CardTitle>
              <CardDescription>
                Enter a URL and select permissions to demonstrate
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* URL Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Target URL
                </label>
                <Input
                  type="url"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="h-12"
                  data-testid="url-input"
                />
              </div>

              {/* Permission Selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">
                  Select Permissions to Demonstrate
                </label>
                <div className="grid gap-3">
                  {permissionOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <div
                        key={option.id}
                        className="flex items-start space-x-3 p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors"
                      >
                        <Checkbox
                          id={option.id}
                          checked={permissions[option.id]}
                          onCheckedChange={() => handlePermissionToggle(option.id)}
                          data-testid={`permission-${option.id}-checkbox`}
                        />
                        <div className="flex-1 flex items-start gap-3 cursor-pointer" onClick={() => handlePermissionToggle(option.id)}>
                          <Icon className="h-5 w-5 text-indigo-600 mt-0.5" />
                          <div className="space-y-1">
                            <label
                              htmlFor={option.id}
                              className="text-sm font-medium leading-none cursor-pointer"
                            >
                              {option.label}
                            </label>
                            <p className="text-sm text-gray-500">
                              {option.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerateLink}
                disabled={loading}
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white"
                data-testid="generate-link-btn"
              >
                {loading ? "Generating..." : "Generate Demo Link"}
              </Button>
            </CardContent>
          </Card>

          {/* Generated Link Display */}
          {generatedLink && (
            <Card className="shadow-lg border-green-200 bg-green-50/30">
              <CardHeader>
                <CardTitle className="text-green-900">Demo Link Generated!</CardTitle>
                <CardDescription className="text-green-700">
                  Share this link to demonstrate the selected permissions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Demo Link
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={generatedLink.demo_url}
                      readOnly
                      className="font-mono text-sm"
                      data-testid="generated-link-input"
                    />
                    <Button
                      onClick={() => copyToClipboard(generatedLink.demo_url)}
                      variant="outline"
                      size="icon"
                      data-testid="copy-link-btn"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Original URL
                  </label>
                  <p className="text-sm text-gray-600 break-all">
                    {generatedLink.original_url}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Permissions to Demonstrate
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {generatedLink.permissions.map((perm) => (
                      <span
                        key={perm}
                        className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium"
                      >
                        {perm.charAt(0).toUpperCase() + perm.slice(1)}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Home;