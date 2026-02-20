import React, { useState, useEffect } from 'react';
import { X, Calendar, Loader2, Plus, ChevronDown } from 'lucide-react';
import { settingsColorPaletteService, ColorPalette } from '../services/settingsColorPaletteService';

interface AddWorkOrderModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSave?: (workOrderData: any) => void;
}

const AddWorkOrderModal: React.FC<AddWorkOrderModalProps> = ({
  isOpen: isOpenProp,
  onClose: onCloseProp,
  onSave: onSaveProp
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(true);
  const isOpen = isOpenProp !== undefined ? isOpenProp : internalIsOpen;
  const onClose = onCloseProp || (() => setInternalIsOpen(false));
  const onSave = onSaveProp || ((data) => console.log('Work order saved:', data));

  // Form state
  const [workCategory, setWorkCategory] = useState('');
  const [instructions, setInstructions] = useState('');
  const [reportTo, setReportTo] = useState('');
  const [assignTo, setAssignTo] = useState('');
  const [remarks, setRemarks] = useState('');
  const [image1, setImage1] = useState<File | null>(null);
  const [image2, setImage2] = useState<File | null>(null);
  const [image3, setImage3] = useState<File | null>(null);
  const [image1Preview, setImage1Preview] = useState('');
  const [image2Preview, setImage2Preview] = useState('');
  const [image3Preview, setImage3Preview] = useState('');

  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('theme') === 'dark');
  const [colorPalette, setColorPalette] = useState<ColorPalette | null>(null);
  
  // Category modal
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categories, setCategories] = useState(['Installation', 'Repair', 'Maintenance', 'Troubleshooting']);
  
  // Dropdowns
  const [showReportToDropdown, setShowReportToDropdown] = useState(false);
  const [showAssignToDropdown, setShowAssignToDropdown] = useState(false);
  const [reportToSearch, setReportToSearch] = useState('');
  const [assignToSearch, setAssignToSearch] = useState('');
  const [employees, setEmployees] = useState<any[]>([]);

  // Auto-filled fields
  const [requestedBy, setRequestedBy] = useState('');
  const [requestedDate, setRequestedDate] = useState('');
  const [updatedBy, setUpdatedBy] = useState('');
  const [updatedDate, setUpdatedDate] = useState('');

  // File refs
  const image1Ref = React.useRef<HTMLInputElement>(null);
  const image2Ref = React.useRef<HTMLInputElement>(null);
  const image3Ref = React.useRef<HTMLInputElement>(null);

  // Initialize
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(localStorage.getItem('theme') === 'dark');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const fetchColorPalette = async () => {
      try {
        const activePalette = await settingsColorPaletteService.getActive();
        setColorPalette(activePalette);
      } catch (err) {
        console.error('Failed to fetch color palette:', err);
      }
    };
    fetchColorPalette();
  }, []);

  useEffect(() => {
    const authData = localStorage.getItem('authData');
    if (authData) {
      try {
        const userData = JSON.parse(authData);
        setRequestedBy(userData.email || '');
        setUpdatedBy(userData.email || '');
      } catch (err) {
        console.error('Failed to parse auth data:', err);
      }
    }

    // Set dates
    const now = new Date();
    const formatted = now.toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
    setRequestedDate(formatted);
    setUpdatedDate(formatted);

    // mock emp lng po 
    setEmployees([
      { id: 1, email: 'admin@example.com', name: 'Admin User', role: 'administrator' },
      { id: 2, email: 'Agent1@example.com', name: 'Agent1', role: 'agent' },
      { id: 3, email: 'Agent2@example.com', name: 'Agent2', role: 'agent' },
      { id: 4, email: 'tech@example.com', name: 'tech', role: 'techinician' }
    ]);
  }, []);

  useEffect(() => {
    if (loading) {
      setLoadingProgress(0);
      const interval = setInterval(() => {
        setLoadingProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return prev;
          }
          return prev + Math.random() * 15;
        });
      }, 200);
      return () => clearInterval(interval);
    }
  }, [loading]);

  const handleImageChange = (file: File | null, imageNum: number) => {
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const preview = reader.result as string;
      if (imageNum === 1) {
        setImage1(file);
        setImage1Preview(preview);
      } else if (imageNum === 2) {
        setImage2(file);
        setImage2Preview(preview);
      } else if (imageNum === 3) {
        setImage3(file);
        setImage3Preview(preview);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleImageRemove = (imageNum: number) => {
    if (imageNum === 1) {
      setImage1(null);
      setImage1Preview('');
      if (image1Ref.current) image1Ref.current.value = '';
    } else if (imageNum === 2) {
      setImage2(null);
      setImage2Preview('');
      if (image2Ref.current) image2Ref.current.value = '';
    } else if (imageNum === 3) {
      setImage3(null);
      setImage3Preview('');
      if (image3Ref.current) image3Ref.current.value = '';
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const searchTerm = reportToSearch.toLowerCase();
    const role = (emp.role || '').toString().toLowerCase();
    if (role.includes('tech')) return false;
    return emp.email.toLowerCase().includes(searchTerm) || emp.name.toLowerCase().includes(searchTerm);
  });

  const filteredEmployeesAssignTo = employees.filter(emp => {
    const searchTerm = assignToSearch.toLowerCase();
    const role = (emp.role || '').toString().toLowerCase();
    if (role.includes('tech')) return false;
    return emp.email.toLowerCase().includes(searchTerm) || emp.name.toLowerCase().includes(searchTerm);
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!workCategory.trim()) {
      newErrors.workCategory = 'Work category is required';
    }
    if (!instructions.trim()) {
      newErrors.instructions = 'Instructions are required';
    }
    if (!reportTo.trim()) {
      newErrors.reportTo = 'Report to is required';
    }
    if (!assignTo.trim()) {
      newErrors.assignTo = 'Assign to is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      setCategories([...categories, newCategoryName]);
      setWorkCategory(newCategoryName);
      setNewCategoryName('');
      setShowCategoryModal(false);
    }
  };

  const handleSave = async () => {
    const isValid = validateForm();
    
    if (!isValid) {
      return;
    }

    setLoading(true);
    
    try {
      console.log('Creating work order:', {
        workCategory,
        instructions,
        reportTo,
        assignTo,
        remarks,
        requestedBy,
        requestedDate,
        updatedBy,
        updatedDate
      });
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const formData = new FormData();
      formData.append('workCategory', workCategory);
      formData.append('instructions', instructions);
      formData.append('reportTo', reportTo);
      formData.append('assignTo', assignTo);
      formData.append('remarks', remarks);
      formData.append('requestedBy', requestedBy);
      formData.append('requestedDate', requestedDate);
      formData.append('updatedBy', updatedBy);
      formData.append('updatedDate', updatedDate);
      if (image1) formData.append('image1', image1);
      if (image2) formData.append('image2', image2);
      if (image3) formData.append('image3', image3);
      
      onSave(Object.fromEntries(formData));
      
      setLoadingProgress(100);
      
      setTimeout(() => {
        setLoading(false);
        handleClose();
      }, 500);
    } catch (error: any) {
      console.error('Error creating work order:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create work order. Please try again.';
      alert(`Error: ${errorMessage}`);
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    
    setWorkCategory('');
    setInstructions('');
    setReportTo('');
    setAssignTo('');
    setRemarks('');
    setImage1(null);
    setImage2(null);
    setImage3(null);
    setImage1Preview('');
    setImage2Preview('');
    setImage3Preview('');
    setErrors({});
    setLoadingProgress(0);
    setShowReportToDropdown(false);
    setShowAssignToDropdown(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-end z-50">
        <div className={`h-full w-full max-w-2xl shadow-2xl transform transition-transform duration-300 ease-in-out translate-x-0 overflow-hidden flex flex-col ${
          isDarkMode ? 'bg-gray-900' : 'bg-white'
        }`}>
          <div className={`px-6 py-4 flex items-center justify-between ${
            isDarkMode ? 'bg-gray-900' : 'bg-gray-100'
          }`}>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleClose}
                disabled={loading}
                className={`transition-colors disabled:cursor-not-allowed ${
                  isDarkMode
                    ? 'text-gray-400 hover:text-white disabled:text-gray-600'
                    : 'text-gray-600 hover:text-gray-900 disabled:text-gray-400'
                }`}
              >
                <X size={24} />
              </button>
              <h2 className={`text-xl font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Work Order Form</h2>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleClose}
                disabled={loading}
                className={`px-6 py-2 border rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  isDarkMode
                    ? 'border-red-600 text-red-600 hover:bg-red-600 hover:text-white'
                    : 'border-red-500 text-red-500 hover:bg-red-500 hover:text-white'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-sm flex items-center"
                style={{
                  backgroundColor: colorPalette?.primary || '#ea580c'
                }}
                onMouseEnter={(e) => {
                  if (colorPalette?.accent && !loading) {
                    e.currentTarget.style.backgroundColor = colorPalette.accent;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = colorPalette?.primary || '#ea580c';
                }}
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Save
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-6">
            {/* Work Category */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Work Category<span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <select
                    value={workCategory}
                    onChange={(e) => {
                      setWorkCategory(e.target.value);
                      if (errors.workCategory) {
                        setErrors(prev => ({ ...prev, workCategory: '' }));
                      }
                    }}
                    disabled={loading}
                    className={`w-full px-4 py-3 border rounded focus:outline-none appearance-none pr-10 disabled:cursor-not-allowed ${
                      errors.workCategory ? 'border-red-500' : isDarkMode ? 'border-gray-700' : 'border-gray-300'
                    } ${
                      isDarkMode
                        ? 'bg-gray-900 text-white disabled:bg-gray-800'
                        : 'bg-white text-gray-900 disabled:bg-gray-100'
                    }`}
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <ChevronDown className={`absolute right-3 top-3.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} size={20} />
                </div>
                <button
                  onClick={() => setShowCategoryModal(true)}
                  disabled={loading}
                  className="px-4 py-3 rounded text-sm flex items-center disabled:opacity-50"
                  style={{ backgroundColor: colorPalette?.primary || '#ea580c', color: 'white' }}
                >
                  <Plus size={16} />
                </button>
              </div>
              {errors.workCategory && <p className="text-red-500 text-xs mt-1">{errors.workCategory}</p>}
            </div>

            {/* Instructions */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Instructions<span className="text-red-500">*</span>
              </label>
              <textarea
                value={instructions}
                onChange={(e) => {
                  setInstructions(e.target.value);
                  if (errors.instructions) {
                    setErrors(prev => ({ ...prev, instructions: '' }));
                  }
                }}
                placeholder="Enter work instructions"
                disabled={loading}
                rows={3}
                className={`w-full px-4 py-3 border rounded focus:outline-none disabled:cursor-not-allowed ${
                  errors.instructions ? 'border-red-500' : isDarkMode ? 'border-gray-700' : 'border-gray-300'
                } ${
                  isDarkMode
                    ? 'bg-gray-900 text-white disabled:bg-gray-800'
                    : 'bg-white text-gray-900 disabled:bg-gray-100'
                }`}
              />
              {errors.instructions && <p className="text-red-500 text-xs mt-1">{errors.instructions}</p>}
            </div>

            {/* Report To */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Report To<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={reportTo}
                  onChange={(e) => {
                    setReportTo(e.target.value);
                    setReportToSearch(e.target.value);
                    setShowReportToDropdown(true);
                    if (errors.reportTo) {
                      setErrors(prev => ({ ...prev, reportTo: '' }));
                    }
                  }}
                  onFocus={() => setShowReportToDropdown(true)}
                  placeholder="Search email..."
                  disabled={loading}
                  className={`w-full px-4 py-3 border rounded focus:outline-none disabled:cursor-not-allowed ${
                    errors.reportTo ? 'border-red-500' : isDarkMode ? 'border-gray-700' : 'border-gray-300'
                  } ${
                    isDarkMode
                      ? 'bg-gray-900 text-white disabled:bg-gray-800'
                      : 'bg-white text-gray-900 disabled:bg-gray-100'
                  }`}
                />
                {showReportToDropdown && (
                  <div className={`absolute top-full left-0 right-0 mt-1 border rounded shadow-lg z-10 max-h-48 overflow-y-auto ${
                    isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
                  }`}>
                    {filteredEmployees.map((emp) => (
                      <button
                        key={emp.id}
                        onClick={() => {
                          setReportTo(emp.email);
                          setShowReportToDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2 ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                      >
                        <div className="font-medium">{emp.email}</div>
                        <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{emp.name}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {errors.reportTo && <p className="text-red-500 text-xs mt-1">{errors.reportTo}</p>}
            </div>

            {/* Assign To */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Assign To<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={assignTo}
                  onChange={(e) => {
                    setAssignTo(e.target.value);
                    setAssignToSearch(e.target.value);
                    setShowAssignToDropdown(true);
                    if (errors.assignTo) {
                      setErrors(prev => ({ ...prev, assignTo: '' }));
                    }
                  }}
                  onFocus={() => setShowAssignToDropdown(true)}
                  placeholder="Search email..."
                  disabled={loading}
                  className={`w-full px-4 py-3 border rounded focus:outline-none disabled:cursor-not-allowed ${
                    errors.assignTo ? 'border-red-500' : isDarkMode ? 'border-gray-700' : 'border-gray-300'
                  } ${
                    isDarkMode
                      ? 'bg-gray-900 text-white disabled:bg-gray-800'
                      : 'bg-white text-gray-900 disabled:bg-gray-100'
                  }`}
                />
                {showAssignToDropdown && (
                  <div className={`absolute top-full left-0 right-0 mt-1 border rounded shadow-lg z-10 max-h-48 overflow-y-auto ${
                    isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
                  }`}>
                    {filteredEmployeesAssignTo.map((emp) => (
                      <button
                        key={emp.id}
                        onClick={() => {
                          setAssignTo(emp.email);
                          setShowAssignToDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2 ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                      >
                        <div className="font-medium">{emp.email}</div>
                        <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{emp.name}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {errors.assignTo && <p className="text-red-500 text-xs mt-1">{errors.assignTo}</p>}
            </div>

            {/* Remarks */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Remarks
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter remarks"
                disabled={loading}
                rows={3}
                className={`w-full px-4 py-3 border rounded focus:outline-none disabled:cursor-not-allowed ${
                  isDarkMode ? 'border-gray-700' : 'border-gray-300'
                } ${
                  isDarkMode
                    ? 'bg-gray-900 text-white disabled:bg-gray-800'
                    : 'bg-white text-gray-900 disabled:bg-gray-100'
                }`}
              />
            </div>

            {/* Image Uploads */}
            {[1, 2, 3].map((imageNum) => {
              const image = imageNum === 1 ? image1 : imageNum === 2 ? image2 : image3;
              const preview = imageNum === 1 ? image1Preview : imageNum === 2 ? image2Preview : image3Preview;
              const ref = imageNum === 1 ? image1Ref : imageNum === 2 ? image2Ref : image3Ref;
              
              return (
                <div key={imageNum}>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Image {imageNum}
                  </label>
                  <div className={`border-2 border-dashed rounded p-4 text-center cursor-pointer transition-colors ${
                    isDarkMode ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-200'
                  }`}>
                    <input
                      ref={ref}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageChange(e.target.files?.[0] || null, imageNum)}
                      disabled={loading}
                      className="hidden"
                    />
                    {preview ? (
                      <div className="space-y-2">
                        <img src={preview} alt={`Preview ${imageNum}`} className="w-full h-32 object-cover rounded" />
                        <button
                          onClick={() => handleImageRemove(imageNum)}
                          disabled={loading}
                          className="text-red-500 hover:text-red-600 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => ref.current?.click()}
                        disabled={loading}
                        className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                      >
                        Click to upload image
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Auto-filled fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Requested By
                </label>
                <div className={`inline-block px-4 py-2 border rounded-full text-sm ${
                  isDarkMode
                    ? 'bg-gray-800 border-gray-700 text-white'
                    : 'bg-gray-100 border-gray-300 text-gray-900'
                }`}>
                  {requestedBy}
                </div>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Requested Date
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={requestedDate}
                    readOnly
                    className={`w-full px-4 py-3 border rounded focus:outline-none cursor-default ${
                      isDarkMode
                        ? 'bg-gray-900 border-gray-700 text-gray-400'
                        : 'bg-gray-50 border-gray-300 text-gray-600'
                    }`}
                  />
                  <Calendar className={`absolute right-4 top-3.5 ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-400'
                  }`} size={20} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Updated By
                </label>
                <div className={`inline-block px-4 py-2 border rounded-full text-sm ${
                  isDarkMode
                    ? 'bg-gray-800 border-gray-700 text-white'
                    : 'bg-gray-100 border-gray-300 text-gray-900'
                }`}>
                  {updatedBy}
                </div>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Updated Date
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={updatedDate}
                    readOnly
                    className={`w-full px-4 py-3 border rounded focus:outline-none cursor-default ${
                      isDarkMode
                        ? 'bg-gray-900 border-gray-700 text-gray-400'
                        : 'bg-gray-50 border-gray-300 text-gray-600'
                    }`}
                  />
                  <Calendar className={`absolute right-4 top-3.5 ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-400'
                  }`} size={20} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className={`rounded-lg p-6 w-96 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Add New Category
            </h3>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Enter category name"
              className={`w-full px-4 py-2 border rounded mb-4 focus:outline-none ${
                isDarkMode
                  ? 'bg-gray-900 border-gray-700 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAddCategory();
                }
              }}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowCategoryModal(false)}
                className={`px-4 py-2 rounded text-sm ${
                  isDarkMode
                    ? 'bg-gray-700 text-white hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleAddCategory}
                className="px-4 py-2 rounded text-sm text-white"
                style={{ backgroundColor: colorPalette?.primary || '#ea580c' }}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60]">
          <div className={`rounded-lg p-12 flex flex-col items-center gap-6 ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <Loader2 
              className="h-16 w-16 animate-spin" 
              style={{
                color: colorPalette?.primary || '#ea580c'
              }}
            />
            <p className={`font-bold text-4xl ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>{Math.round(loadingProgress)}%</p>
          </div>
        </div>
      )}
    </>
  );
};

export default AddWorkOrderModal;
