import React, { useState, useEffect } from 'react';
import { Palette, Sun, Moon, Plus, Image, Loader2, CheckCircle, XCircle } from 'lucide-react';
import AddColorPaletteModal from '../modals/AddColorPaletteModal';
import { settingsImageSizeService, ImageSize } from '../services/settingsImageSizeService';
import { settingsColorPaletteService, ColorPalette as DbColorPalette } from '../services/settingsColorPaletteService';

interface ColorPalette {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
}

const Settings: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [showAddPaletteModal, setShowAddPaletteModal] = useState<boolean>(false);
  const [dbPalettes, setDbPalettes] = useState<DbColorPalette[]>([]);
  const [imageSizes, setImageSizes] = useState<ImageSize[]>([]);
  const [activeImageSizeId, setActiveImageSizeId] = useState<number | null>(null);
  const [selectedImageSizeId, setSelectedImageSizeId] = useState<number | null>(null);
  const [isEditingImageSize, setIsEditingImageSize] = useState<boolean>(false);
  const [isSavingImageSize, setIsSavingImageSize] = useState<boolean>(false);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [showError, setShowError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    }

    loadImageSizes();
    loadColorPalettes();
  }, []);

  const loadColorPalettes = async () => {
    try {
      const palettes = await settingsColorPaletteService.getAll();
      setDbPalettes(palettes);
    } catch (error) {
      console.error('Failed to load color palettes:', error);
    }
  };

  const loadImageSizes = async () => {
    try {
      const sizes = await settingsImageSizeService.getAll();
      setImageSizes(sizes);
      const active = sizes.find(size => size.status === 'active');
      if (active) {
        setActiveImageSizeId(active.id);
        setSelectedImageSizeId(active.id);
      }
    } catch (error) {
      console.error('Failed to load image sizes:', error);
    }
  };

  const handleThemeToggle = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
    
    if (newTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handlePaletteStatusChange = async (id: number, status: 'active' | 'inactive') => {
    setIsLoading(true);
    setLoadingMessage('Activating color palette...');
    setShowError(false);

    try {
      await settingsColorPaletteService.updateStatus(id, status);
      await loadColorPalettes();
      
      if (status === 'active') {
        const palette = dbPalettes.find(p => p.id === id);
        if (palette) {
          document.documentElement.style.setProperty('--color-primary', palette.primary);
          document.documentElement.style.setProperty('--color-secondary', palette.secondary);
          document.documentElement.style.setProperty('--color-accent', palette.accent);
        }
      }

      setIsLoading(false);
      setSuccessMessage('Color palette activated successfully!');
      setShowSuccess(true);

      setTimeout(() => {
        setShowSuccess(false);
      }, 2000);
    } catch (error) {
      setIsLoading(false);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to activate color palette');
      setShowError(true);

      setTimeout(() => {
        setShowError(false);
      }, 3000);
    }
  };

  const handleEditImageSize = () => {
    setIsEditingImageSize(true);
  };

  const handleCancelImageSize = () => {
    setSelectedImageSizeId(activeImageSizeId);
    setIsEditingImageSize(false);
  };

  const handleSaveImageSize = async () => {
    if (selectedImageSizeId === null) return;

    setIsLoading(true);
    setLoadingMessage('Updating image upload size...');
    setShowError(false);

    try {
      await settingsImageSizeService.updateStatus(selectedImageSizeId, 'active');
      await loadImageSizes();
      setIsEditingImageSize(false);

      setIsLoading(false);
      setSuccessMessage('Image upload size updated successfully!');
      setShowSuccess(true);

      setTimeout(() => {
        setShowSuccess(false);
      }, 2000);
    } catch (error) {
      setIsLoading(false);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update image upload size');
      setShowError(true);

      setTimeout(() => {
        setShowError(false);
      }, 3000);
    }
  };

  const handleAddPalette = async (newPalette: ColorPalette) => {
    await settingsColorPaletteService.create({
      palette_name: newPalette.name,
      primary: newPalette.primary,
      secondary: newPalette.secondary,
      accent: newPalette.accent,
      updated_by: 'system'
    });
    
    await loadColorPalettes();
  };

  const handleDeletePalette = async (id: number) => {
    try {
      await settingsColorPaletteService.delete(id);
      await loadColorPalettes();
    } catch (error) {
      console.error('Failed to delete color palette:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 pb-6 border-b border-gray-700">
        <h2 className="text-2xl font-semibold text-white mb-2">
          Settings
        </h2>
      </div>

      <div className="space-y-6">
        <div className="pb-6 border-b border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <Sun className="h-5 w-5 text-orange-400" />
            <h3 className="text-lg font-semibold text-white">
              Theme Mode
            </h3>
          </div>
          
          <div className="flex items-center justify-between bg-gray-900 p-6 rounded border border-gray-700">
            <div>
              <p className="text-white font-medium mb-1">
                {isDarkMode ? 'Dark Mode' : 'Light Mode'}
              </p>
              <p className="text-gray-400 text-sm">
                Switch between light and dark theme
              </p>
            </div>
            
            <button
              onClick={handleThemeToggle}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                isDarkMode ? 'bg-orange-500' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  isDarkMode ? 'translate-x-7' : 'translate-x-1'
                }`}
              >
                {isDarkMode ? (
                  <Moon className="h-4 w-4 text-orange-500 m-1" />
                ) : (
                  <Sun className="h-4 w-4 text-gray-600 m-1" />
                )}
              </span>
            </button>
          </div>
        </div>

        <div className="pt-6">
          <div className="flex items-center gap-3 mb-4">
            <Palette className="h-5 w-5 text-orange-400" />
            <h3 className="text-lg font-semibold text-white">
              Color Palette
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {dbPalettes.map((palette) => {
              const isDefault = palette.palette_name.toLowerCase() === 'default';
              return (
                <div
                  key={palette.id}
                  className={`bg-gray-900 p-4 rounded border transition-all relative ${
                    palette.status === 'active'
                      ? 'border-orange-500 shadow-lg'
                      : 'border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-white font-medium text-sm">
                      {palette.palette_name}
                    </h4>
                    <div className="flex items-center gap-2">
                      {palette.status === 'active' && (
                        <div className="h-5 w-5 rounded-full bg-orange-500 flex items-center justify-center">
                          <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                      {palette.status === 'inactive' && (
                        <button
                          onClick={() => handlePaletteStatusChange(palette.id, 'active')}
                          className="px-2 py-1 text-xs bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
                        >
                          Activate
                        </button>
                      )}
                      {!isDefault && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete ${palette.palette_name}?`)) {
                              handleDeletePalette(palette.id);
                            }
                          }}
                          className="p-1 text-red-400 hover:text-red-300 hover:bg-red-900 rounded transition-colors"
                          title="Delete palette"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                
                <div className="flex gap-2">
                  <div className="flex-1">
                    <div
                      className="h-10 rounded"
                      style={{ backgroundColor: palette.primary }}
                    />
                    <p className="text-xs text-gray-400 mt-1 text-center">
                      Primary
                    </p>
                  </div>
                  <div className="flex-1">
                    <div
                      className="h-10 rounded"
                      style={{ backgroundColor: palette.secondary }}
                    />
                    <p className="text-xs text-gray-400 mt-1 text-center">
                      Secondary
                    </p>
                  </div>
                  <div className="flex-1">
                    <div
                      className="h-10 rounded"
                      style={{ backgroundColor: palette.accent }}
                    />
                    <p className="text-xs text-gray-400 mt-1 text-center">
                      Accent
                    </p>
                  </div>
                </div>
              </div>
              );
            })}
            
            <button
              onClick={() => setShowAddPaletteModal(true)}
              className="bg-gray-900 p-4 rounded border border-dashed border-gray-700 hover:border-orange-500 transition-all flex flex-col items-center justify-center gap-2 min-h-[140px]"
            >
              <div className="h-10 w-10 rounded-full bg-gray-800 flex items-center justify-center">
                <Plus className="h-5 w-5 text-orange-400" />
              </div>
              <p className="text-white font-medium text-sm">Add Custom Palette</p>
              <p className="text-gray-400 text-xs text-center">
                Create your own color scheme
              </p>
            </button>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <Image className="h-5 w-5 text-orange-400" />
            <h3 className="text-lg font-semibold text-white">
              Image Upload Size
            </h3>
          </div>

          <div className="bg-gray-900 p-4 rounded border border-gray-700">
            <div className="space-y-2 mb-4">
              {imageSizes.map((size) => (
                <div
                  key={size.id}
                  onClick={() => isEditingImageSize && setSelectedImageSizeId(size.id)}
                  className={`flex items-center justify-between p-3 rounded border transition-all ${
                    isEditingImageSize ? 'cursor-pointer' : ''
                  } ${
                    selectedImageSizeId === size.id
                      ? 'border-orange-500 bg-orange-500/10'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-white font-medium">
                      {size.image_size}
                    </span>
                    <span className="text-gray-400 text-sm">
                      -{size.image_size_value}% maximum size
                    </span>
                  </div>
                  {size.status === 'active' && !isEditingImageSize && (
                    <div className="h-5 w-5 rounded-full bg-orange-500 flex items-center justify-center">
                      <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  {selectedImageSizeId === size.id && isEditingImageSize && (
                    <div className="h-5 w-5 rounded-full bg-orange-500 flex items-center justify-center">
                      <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              {!isEditingImageSize ? (
                <button
                  onClick={handleEditImageSize}
                  className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors text-sm"
                >
                  Edit
                </button>
              ) : (
                <>
                  <button
                    onClick={handleSaveImageSize}
                    disabled={isSavingImageSize || selectedImageSizeId === activeImageSizeId}
                    className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed text-sm"
                  >
                    {isSavingImageSize ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleCancelImageSize}
                    disabled={isSavingImageSize}
                    className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed text-sm"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <AddColorPaletteModal
        isOpen={showAddPaletteModal}
        onClose={() => setShowAddPaletteModal(false)}
        onSave={handleAddPalette}
      />

      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60]">
          <div className="bg-gray-800 rounded-lg p-8 flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 text-orange-500 animate-spin" />
            <p className="text-white font-medium">{loadingMessage}</p>
          </div>
        </div>
      )}

      {showSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60]">
          <div className="bg-gray-800 rounded-lg p-8 flex flex-col items-center gap-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
            <p className="text-white font-medium text-lg">{successMessage}</p>
          </div>
        </div>
      )}

      {showError && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60]">
          <div className="bg-gray-800 rounded-lg p-8 flex flex-col items-center gap-4">
            <XCircle className="h-16 w-16 text-red-500" />
            <p className="text-white font-medium text-lg">Error</p>
            <p className="text-gray-300 text-sm text-center max-w-md">{errorMessage}</p>
            <button
              onClick={() => setShowError(false)}
              className="mt-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
