import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Building2, MapPin, Star, Clock, ShieldCheck, Plus, ArrowLeft, Upload, Image as ImageIcon, X, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const AddEditHotel = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useAuth();

  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: 'Ahmedabad',
    state: 'Gujarat',
    zip_code: '380009',
    star_rating: 4,
    check_in_time: '12:00 PM',
    check_out_time: '11:00 AM',
    rules: 'Valid government ID required at check-in.',
    cancellation_policy: 'Free cancellation up to 24 hours prior to check-in.',
    amenity_ids: [1, 2, 3, 4],
  });

  // Local File Uploads & Previews
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);

  // Existing Uploaded Images
  const [existingImages, setExistingImages] = useState([]);
  
  // Optional URL fallback
  const [urlInput, setUrlInput] = useState('');

  const [amenitiesList, setAmenitiesList] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAmenities();
    if (isEditMode) {
      fetchHotelDetails();
    }
  }, [id]);

  const fetchAmenities = async () => {
    try {
      const res = await api.get('/hotels/amenities/');
      setAmenitiesList(res.data.results || res.data);
    } catch (err) {
      console.error('Failed to load amenities:', err);
    }
  };

  const fetchHotelDetails = async () => {
    try {
      const res = await api.get(`/hotels/${id}/`);
      const h = res.data;
      setFormData({
        name: h.name,
        description: h.description,
        address: h.address,
        city: h.city,
        state: h.state,
        zip_code: h.zip_code || '',
        star_rating: h.star_rating,
        check_in_time: h.check_in_time,
        check_out_time: h.check_out_time,
        rules: h.rules || '',
        cancellation_policy: h.cancellation_policy || '',
        amenity_ids: h.amenities ? h.amenities.map((a) => a.id) : [],
      });
      if (h.images && h.images.length > 0) {
        setExistingImages(h.images);
      }
    } catch (err) {
      showToast('Failed to load hotel details.', 'error');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAmenityToggle = (amenityId) => {
    setFormData((prev) => {
      const current = prev.amenity_ids;
      if (current.includes(amenityId)) {
        return { ...prev, amenity_ids: current.filter((a) => a !== amenityId) };
      } else {
        return { ...prev, amenity_ids: [...current, amenityId] };
      }
    });
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const newFiles = [...selectedFiles, ...files];
    setSelectedFiles(newFiles);

    const newPreviews = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
    setFilePreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeSelectedFile = (index) => {
    const updatedFiles = [...selectedFiles];
    updatedFiles.splice(index, 1);
    setSelectedFiles(updatedFiles);

    const updatedPreviews = [...filePreviews];
    URL.revokeObjectURL(updatedPreviews[index].url);
    updatedPreviews.splice(index, 1);
    setFilePreviews(updatedPreviews);
  };

  const handleAddUrl = () => {
    if (!urlInput.trim()) return;
    setFilePreviews((prev) => [...prev, { file: null, url: urlInput.trim() }]);
    setUrlInput('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let hotelId = id;
      if (isEditMode) {
        await api.patch(`/hotels/${id}/`, formData);
        showToast('Hotel property updated successfully!');
      } else {
        const res = await api.post('/hotels/', formData);
        hotelId = res.data.id;
        showToast('Hotel submitted for Super Admin review & approval!');
      }

      // Upload selected file objects as Multipart FormData
      for (let i = 0; i < filePreviews.length; i++) {
        const item = filePreviews[i];
        if (item.file) {
          const uploadData = new FormData();
          uploadData.append('image', item.file);
          uploadData.append('is_primary', (existingImages.length === 0 && i === 0) ? 'true' : 'false');
          await api.post(`/hotels/${hotelId}/upload-image/`, uploadData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        } else if (item.url) {
          await api.post(`/hotels/${hotelId}/upload-image/`, {
            image_url: item.url,
            is_primary: (existingImages.length === 0 && i === 0) ? 'true' : 'false',
          });
        }
      }

      navigate('/owner/dashboard');
    } catch (err) {
      console.error('Hotel save error:', err);
      let errMsg = 'Failed to save hotel details.';
      if (err.response?.data) {
        const data = err.response.data;
        if (typeof data === 'string') errMsg = data;
        else if (typeof data === 'object') {
          const keys = Object.keys(data);
          if (keys.length > 0) {
            const val = data[keys[0]];
            errMsg = `${keys[0]}: ${Array.isArray(val) ? val[0] : val}`;
          }
        }
      }
      showToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 bg-slate-50 text-slate-900">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Navigation back */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/owner/dashboard')}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-teal-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-teal-600" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900">
              {isEditMode ? 'Edit Hotel Property' : 'List New Hotel Property'}
            </h1>
            <p className="text-xs text-slate-500 font-semibold">Upload hotel photos and define property features</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="card-white p-8 space-y-6 shadow-md border border-slate-200">
          
          {/* Hotel Name & Star Rating */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                Hotel Name
              </label>
              <input
                type="text"
                required
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. The Grand Royal Palace & Resort"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:border-teal-600 focus:bg-white outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                Star Rating
              </label>
              <select
                name="star_rating"
                value={formData.star_rating}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:border-teal-600 outline-none"
              >
                <option value={3}>3 Star Hotel</option>
                <option value={4}>4 Star Luxury Hotel</option>
                <option value={5}>5 Star Palace Resort</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
              Property Description
            </label>
            <textarea
              required
              rows={4}
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe your hotel rooms, ambience, dining, location highlights..."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:border-teal-600 focus:bg-white resize-none outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>

          {/* Location Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                Street Address
              </label>
              <input
                type="text"
                required
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="CG Road, Navrangpura"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:border-teal-600 focus:bg-white outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                City
              </label>
              <input
                type="text"
                required
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Ahmedabad"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:border-teal-600 focus:bg-white outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                State
              </label>
              <input
                type="text"
                required
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="Gujarat"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:border-teal-600 focus:bg-white outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                Zip / Postal Code
              </label>
              <input
                type="text"
                name="zip_code"
                value={formData.zip_code}
                onChange={handleChange}
                placeholder="380009"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:border-teal-600 focus:bg-white outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
          </div>

          {/* Timings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                Standard Check-in Time
              </label>
              <input
                type="text"
                name="check_in_time"
                value={formData.check_in_time}
                onChange={handleChange}
                placeholder="12:00 PM"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:border-teal-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                Standard Check-out Time
              </label>
              <input
                type="text"
                name="check_out_time"
                value={formData.check_out_time}
                onChange={handleChange}
                placeholder="11:00 AM"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:border-teal-600 outline-none"
              />
            </div>
          </div>

          {/* Hotel Amenities Selection */}
          <div className="space-y-3 pt-2">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700">
              Select Hotel Amenities
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {amenitiesList.map((a) => {
                const isSelected = formData.amenity_ids.includes(a.id);
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => handleAmenityToggle(a.id)}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-bold text-left transition-all ${
                      isSelected
                        ? 'bg-teal-50 border-teal-600 text-teal-800 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-md border flex items-center justify-center ${isSelected ? 'bg-teal-600 border-teal-600 text-white' : 'border-slate-300'}`}>
                      {isSelected && <span className="text-[10px] font-black">✓</span>}
                    </div>
                    <span>{a.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Local Photo File Upload Section */}
          <div className="space-y-4 pt-2">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700">
              Upload Hotel Photos (From Device)
            </label>

            {/* Dropzone File Picker */}
            <div className="border-2 border-dashed border-teal-600/40 hover:border-teal-600 bg-teal-50/40 rounded-2xl p-6 text-center transition-colors">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                id="hotel-photo-upload"
                className="hidden"
              />
              <label htmlFor="hotel-photo-upload" className="cursor-pointer space-y-2 block">
                <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center mx-auto shadow-sm">
                  <Upload className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900">Click here to upload photos from your device</p>
                  <p className="text-xs text-slate-500 font-medium">Supports JPG, PNG, WEBP images (Multiple files allowed)</p>
                </div>
              </label>
            </div>

            {/* Preview Selected Thumbnails */}
            {filePreviews.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-600">Selected Photos to Upload ({filePreviews.length}):</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {filePreviews.map((item, idx) => (
                    <div key={idx} className="relative group h-28 rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
                      <img src={item.url} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeSelectedFile(idx)}
                        className="absolute top-1.5 right-1.5 p-1 rounded-full bg-rose-600 text-white shadow-md hover:bg-rose-700 transition-colors"
                        title="Remove photo"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Existing Uploaded Photos list if editing */}
            {existingImages.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-600">Already Uploaded Hotel Photos:</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {existingImages.map((img) => (
                    <div key={img.id} className="relative h-28 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                      <img src={img.display_url || img.image_url} alt="Uploaded" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Optional URL Input Fallback */}
            <div className="pt-2">
              <details className="text-xs text-slate-500 font-semibold cursor-pointer">
                <summary className="hover:text-teal-600">Or add photo via web image URL link</summary>
                <div className="mt-2 flex gap-2">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddUrl}
                    className="btn-dark py-2 px-4 text-xs font-bold"
                  >
                    Add URL
                  </button>
                </div>
              </details>
            </div>

          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate('/owner/dashboard')}
              className="btn-dark py-3 px-6 text-xs uppercase tracking-wider"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={loading}
              className="btn-teal py-3 px-8 text-xs uppercase tracking-wider font-extrabold shadow-lg shadow-teal-600/30"
            >
              {loading ? 'Uploading & Saving Property...' : isEditMode ? 'Update Hotel' : 'Save & Publish Hotel'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AddEditHotel;
