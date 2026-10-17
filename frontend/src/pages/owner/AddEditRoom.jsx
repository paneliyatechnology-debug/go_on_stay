import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BedDouble, IndianRupee, Users, ArrowLeft, Plus, Upload, X, Building, Image as ImageIcon } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const AddEditRoom = () => {
  const { hotelId, roomId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useAuth();

  const isEditMode = Boolean(roomId);

  const [formData, setFormData] = useState({
    hotel: parseInt(hotelId),
    room_type: 'DELUXE',
    title: '',
    description: '',
    price_per_night: '2500.00',
    capacity_adults: 2,
    capacity_children: 1,
    bed_type: 'King Bed',
    breakfast_included: true,
    free_cancellation: true,
    total_rooms: 1,
    room_numbers: '101',
    amenity_ids: [1, 3],
  });

  // Hotel Property Photos state (Multiple)
  const [hotelFiles, setHotelFiles] = useState([]);
  const [hotelPreviews, setHotelPreviews] = useState([]);
  const [existingHotelImages, setExistingHotelImages] = useState([]);

  // Room Category Photos state (Multiple)
  const [roomFiles, setRoomFiles] = useState([]);
  const [roomPreviews, setRoomPreviews] = useState([]);
  const [existingRoomImages, setExistingRoomImages] = useState([]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchHotelDetails();
    if (isEditMode) {
      fetchRoomDetails();
    }
  }, [hotelId, roomId]);

  const fetchHotelDetails = async () => {
    try {
      const res = await api.get(`/hotels/${hotelId}/`);
      if (res.data && res.data.images) {
        setExistingHotelImages(res.data.images);
      }
    } catch (err) {
      console.error('Failed to load hotel photos:', err);
    }
  };

  const fetchRoomDetails = async () => {
    try {
      const res = await api.get(`/rooms/${roomId}/`);
      const r = res.data;
      setFormData({
        hotel: r.hotel,
        room_type: r.room_type,
        title: r.title,
        description: r.description || '',
        price_per_night: r.price_per_night,
        capacity_adults: r.capacity_adults,
        capacity_children: r.capacity_children,
        bed_type: r.bed_type,
        breakfast_included: r.breakfast_included,
        free_cancellation: r.free_cancellation,
        total_rooms: r.total_rooms,
        room_numbers: r.room_numbers || '',
        amenity_ids: r.amenities ? r.amenities.map((a) => a.id) : [],
      });
      if (r.images && r.images.length > 0) {
        setExistingRoomImages(r.images);
      }
    } catch (err) {
      showToast('Failed to load room details.', 'error');
    }
  };

  const generateRoomNumbers = (count) => {
    const num = parseInt(count) || 0;
    if (num <= 0) return '';
    return Array.from({ length: num }, (_, i) => 101 + i).join(', ');
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;

    if (name === 'total_rooms') {
      const roomCount = parseInt(val) || 0;
      const autoNumbers = generateRoomNumbers(roomCount);
      setFormData((prev) => ({
        ...prev,
        total_rooms: val,
        room_numbers: autoNumbers,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: val }));
    }
  };

  // Handle Hotel Photos Selection (Multiple)
  const handleHotelFilesChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setHotelFiles((prev) => [...prev, ...files]);
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setHotelPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeHotelFile = (index) => {
    if (hotelPreviews[index]) {
      URL.revokeObjectURL(hotelPreviews[index]);
    }
    setHotelFiles((prev) => prev.filter((_, i) => i !== index));
    setHotelPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle Room Photos Selection (Multiple)
  const handleRoomFilesChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setRoomFiles((prev) => [...prev, ...files]);
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setRoomPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeRoomFile = (index) => {
    if (roomPreviews[index]) {
      URL.revokeObjectURL(roomPreviews[index]);
    }
    setRoomFiles((prev) => prev.filter((_, i) => i !== index));
    setRoomPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let targetRoomId = roomId;
      if (isEditMode) {
        await api.patch(`/rooms/${roomId}/`, formData);
        showToast('Room category updated successfully!');
      } else {
        const res = await api.post('/rooms/', formData);
        targetRoomId = res.data.id;
        showToast('Room category added successfully!');
      }

      // 1. Upload multiple Hotel Photos (if selected)
      if (hotelFiles.length > 0) {
        for (let i = 0; i < hotelFiles.length; i++) {
          const uploadData = new FormData();
          uploadData.append('image', hotelFiles[i]);
          if (i === 0 && existingHotelImages.length === 0) {
            uploadData.append('is_primary', 'true');
          }
          await api.post(`/hotels/${hotelId}/upload-image/`, uploadData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        }
      }

      // 2. Upload multiple Room Category Photos (if selected)
      if (roomFiles.length > 0) {
        for (let i = 0; i < roomFiles.length; i++) {
          const uploadData = new FormData();
          uploadData.append('image', roomFiles[i]);
          if (i === 0 && existingRoomImages.length === 0) {
            uploadData.append('is_primary', 'true');
          }
          await api.post(`/rooms/${targetRoomId}/upload-image/`, uploadData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        }
      }

      navigate(`/owner/hotels/${hotelId}/rooms`);
    } catch (err) {
      console.error('Room save error:', err);
      let errMsg = 'Failed to save room category.';
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
            onClick={() => navigate(`/owner/hotels/${hotelId}/rooms`)}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-teal-600 shadow-sm transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-teal-600" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900">
              {isEditMode ? 'Edit Room Category' : 'Add Room Category'}
            </h1>
            <p className="text-xs text-slate-500 font-semibold">Define room details and manage multiple hotel & room photos</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="card-white p-8 space-y-8 shadow-md border border-slate-200">
          
          {/* Room Title & Room Type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                Room Title
              </label>
              <input
                type="text"
                required
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Deluxe King Suite with Pool View"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:border-teal-600 focus:bg-white outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                Room Category Type
              </label>
              <select
                name="room_type"
                value={formData.room_type}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:border-teal-600 outline-none"
              >
                <option value="DELUXE">Deluxe Room</option>
                <option value="SUPER_DELUXE">Super Deluxe Room</option>
                <option value="EXECUTIVE">Executive Suite</option>
                <option value="FAMILY">Family Suite</option>
                <option value="PRESIDENTIAL">Presidential Suite</option>
              </select>
            </div>
          </div>

          {/* Pricing & Physical Inventory Count */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                Price Per Night (₹ INR)
              </label>
              <input
                type="number"
                step="0.01"
                required
                name="price_per_night"
                value={formData.price_per_night}
                onChange={handleChange}
                placeholder="2500.00"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-teal-600 focus:border-teal-600 focus:bg-white outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                Total Physical Rooms Count
              </label>
              <input
                type="number"
                required
                min="1"
                name="total_rooms"
                value={formData.total_rooms}
                onChange={handleChange}
                placeholder="5"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold focus:border-teal-600 focus:bg-white outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
          </div>

          {/* Specific Room / Villa Numbers Configuration */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1">
              Room / Villa Numbers (Comma-separated list)
            </label>
            <p className="text-[11px] text-slate-500 mb-1.5 font-semibold">
              Enter specific numbers or names for each room/villa so customers can pick room numbers during reservation (e.g. 101, 102, 103 or Villa-1, Villa-2).
            </p>
            <input
              type="text"
              name="room_numbers"
              value={formData.room_numbers}
              onChange={handleChange}
              placeholder="e.g. 101, 102, 103, 104, 105 or Villa-1, Villa-2"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900 focus:border-teal-600 focus:bg-white outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>

          {/* Guest Capacity & Bed Type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                Max Adults
              </label>
              <input
                type="number"
                required
                min="1"
                name="capacity_adults"
                value={formData.capacity_adults}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold focus:border-teal-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                Max Children
              </label>
              <input
                type="number"
                required
                min="0"
                name="capacity_children"
                value={formData.capacity_children}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold focus:border-teal-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                Bed Configuration
              </label>
              <input
                type="text"
                required
                name="bed_type"
                value={formData.bed_type}
                onChange={handleChange}
                placeholder="King Bed / Queen Bed / Twin Beds"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:border-teal-600 outline-none"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
              Room Description
            </label>
            <textarea
              rows={3}
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe room amenities, view, bathroom features..."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:border-teal-600 focus:bg-white resize-none outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <label className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100/80 transition-colors">
              <input
                type="checkbox"
                name="breakfast_included"
                checked={formData.breakfast_included}
                onChange={handleChange}
                className="w-4 h-4 text-teal-600 rounded"
              />
              <span className="text-xs font-extrabold text-slate-900">Breakfast Included in Tariff</span>
            </label>

            <label className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100/80 transition-colors">
              <input
                type="checkbox"
                name="free_cancellation"
                checked={formData.free_cancellation}
                onChange={handleChange}
                className="w-4 h-4 text-teal-600 rounded"
              />
              <span className="text-xs font-extrabold text-slate-900">Free Cancellation Allowed</span>
            </label>
          </div>

          {/* SEPARATE MEDIA UPLOAD SECTIONS */}
          <div className="border-t border-slate-200 pt-6 space-y-8">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-teal-600" />
              Property & Room Photo Uploads
            </h2>

            {/* SECTION 1: HOTEL PROPERTY PHOTOS */}
            <div className="p-5 rounded-2xl bg-amber-50/40 border border-amber-200/80 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-amber-900 flex items-center gap-2">
                    <Building className="w-4 h-4 text-amber-600" />
                    1. Hotel Property Photos (Exterior, Lobby, Reception, Pool, Building)
                  </h3>
                  <p className="text-xs text-amber-700 font-medium mt-0.5">
                    Upload general hotel photos representing the entire property. You can select multiple images at once.
                  </p>
                </div>
                {hotelFiles.length > 0 && (
                  <span className="text-xs font-bold px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full">
                    {hotelFiles.length} new selected
                  </span>
                )}
              </div>

              {/* Upload Dropzone */}
              <div className="border-2 border-dashed border-amber-300 hover:border-amber-500 bg-white rounded-xl p-5 text-center transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleHotelFilesChange}
                  id="hotel-photos-upload"
                  className="hidden"
                />
                <label htmlFor="hotel-photos-upload" className="cursor-pointer space-y-2 block">
                  <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-sm">
                    <Upload className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-slate-900">
                      Click to choose Hotel Property photos (Select Multiple)
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium">PNG, JPG, WEBP formats supported</p>
                  </div>
                </label>
              </div>

              {/* Previews of newly selected Hotel images */}
              {hotelPreviews.length > 0 && (
                <div>
                  <p className="text-xs font-extrabold text-amber-900 mb-2">New Hotel Photos to Upload:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {hotelPreviews.map((previewUrl, idx) => (
                      <div key={idx} className="relative group h-28 rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
                        <img src={previewUrl} alt={`Hotel Upload ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeHotelFile(idx)}
                          className="absolute top-1.5 right-1.5 p-1.5 rounded-full bg-rose-600 text-white shadow-md hover:bg-rose-700 transition-colors"
                          title="Remove image"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Existing Uploaded Hotel Photos */}
              {existingHotelImages.length > 0 && (
                <div>
                  <p className="text-xs font-extrabold text-slate-700 mb-2">Existing Hotel Photos:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {existingHotelImages.map((img, idx) => (
                      <div key={img.id || idx} className="h-28 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 relative">
                        <img
                          src={img.display_url || img.image_url}
                          alt="Hotel Property"
                          className="w-full h-full object-cover"
                        />
                        {img.is_primary && (
                          <span className="absolute bottom-1 left-1 text-[9px] font-black uppercase bg-teal-600 text-white px-1.5 py-0.5 rounded shadow">
                            Primary
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 2: ROOM CATEGORY PHOTOS */}
            <div className="p-5 rounded-2xl bg-teal-50/40 border border-teal-200/80 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-teal-950 flex items-center gap-2">
                    <BedDouble className="w-4 h-4 text-teal-600" />
                    2. Room Category Photos (Interior Bed, Washroom, Balcony)
                  </h3>
                  <p className="text-xs text-teal-800 font-medium mt-0.5">
                    Upload photos specific to this room type. You can select multiple images at once.
                  </p>
                </div>
                {roomFiles.length > 0 && (
                  <span className="text-xs font-bold px-2.5 py-1 bg-teal-100 text-teal-800 rounded-full">
                    {roomFiles.length} new selected
                  </span>
                )}
              </div>

              {/* Upload Dropzone */}
              <div className="border-2 border-dashed border-teal-400 hover:border-teal-600 bg-white rounded-xl p-5 text-center transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleRoomFilesChange}
                  id="room-photos-upload"
                  className="hidden"
                />
                <label htmlFor="room-photos-upload" className="cursor-pointer space-y-2 block">
                  <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center mx-auto shadow-sm">
                    <Upload className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-slate-900">
                      Click to choose Room Category photos (Select Multiple)
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium">PNG, JPG, WEBP formats supported</p>
                  </div>
                </label>
              </div>

              {/* Previews of newly selected Room images */}
              {roomPreviews.length > 0 && (
                <div>
                  <p className="text-xs font-extrabold text-teal-900 mb-2">New Room Photos to Upload:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {roomPreviews.map((previewUrl, idx) => (
                      <div key={idx} className="relative group h-28 rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
                        <img src={previewUrl} alt={`Room Upload ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeRoomFile(idx)}
                          className="absolute top-1.5 right-1.5 p-1.5 rounded-full bg-rose-600 text-white shadow-md hover:bg-rose-700 transition-colors"
                          title="Remove image"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Existing Uploaded Room Photos */}
              {existingRoomImages.length > 0 && (
                <div>
                  <p className="text-xs font-extrabold text-slate-700 mb-2">Existing Room Photos:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {existingRoomImages.map((img, idx) => (
                      <div key={img.id || idx} className="h-28 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 relative">
                        <img
                          src={img.display_url || img.image_url}
                          alt="Room Interior"
                          className="w-full h-full object-cover"
                        />
                        {img.is_primary && (
                          <span className="absolute bottom-1 left-1 text-[9px] font-black uppercase bg-teal-600 text-white px-1.5 py-0.5 rounded shadow">
                            Primary
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate(`/owner/hotels/${hotelId}/rooms`)}
              className="btn-dark py-3 px-6 text-xs uppercase tracking-wider font-extrabold"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={loading}
              className="btn-teal py-3 px-8 text-xs uppercase tracking-wider font-extrabold shadow-lg shadow-teal-600/30"
            >
              {loading ? 'Uploading Photos & Saving...' : isEditMode ? 'Update Room & Photos' : 'Save Room & Photos'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AddEditRoom;
