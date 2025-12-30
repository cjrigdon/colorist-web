import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import DropdownMenu from './DropdownMenu';

const ColoristLog = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [entries, setEntries] = useState([]);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [formData, setFormData] = useState({
    date: '',
    inspiration: '',
    book: '',
    pencilSet: '',
    palette: '',
    combo: '',
    notes: '',
    tags: '',
    images: [],
    videos: []
  });

  // Mock data
  const inspirations = [
    { id: 1, title: 'Watercolor Pencil Techniques' },
    { id: 2, title: 'Nature Color Palette' },
    { id: 3, title: 'Blending Techniques' },
  ];

  const books = [
    { id: 1, title: 'Floral Dreams Coloring Book' },
    { id: 2, title: 'Nature Scenes' },
    { id: 3, title: 'Mandala Patterns' },
  ];

  const pencilSets = [
    { id: 1, name: 'Prismacolor Premier', brand: 'Prismacolor' },
    { id: 2, name: 'Faber-Castell Polychromos', brand: 'Faber-Castell' },
    { id: 3, name: 'Derwent Coloursoft', brand: 'Derwent' },
  ];

  const palettes = [
    { id: 1, name: 'Sunset Vibes' },
    { id: 2, name: 'Ocean Blues' },
    { id: 3, name: 'Forest Greens' },
  ];

  const combos = [
    { id: 1, name: 'Red & Orange Combo' },
    { id: 2, name: 'Blue & Purple Combo' },
    { id: 3, name: 'Green & Yellow Combo' },
  ];

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  // Get entries for selected date
  useEffect(() => {
    const dateStr = formatDate(selectedDate);
    // Mock entries - in real app, fetch from API
    const mockEntries = [
      {
        id: 1,
        date: dateStr,
        inspiration: inspirations[0],
        book: books[0],
        pencilSet: pencilSets[0],
        palette: palettes[0],
        combo: null,
        notes: 'Great session today! Really enjoyed working with the watercolor techniques.',
        tags: ['watercolor', 'floral', 'relaxing'],
        images: [],
        videos: []
      }
    ];
    setEntries(mockEntries.filter(e => e.date === dateStr));
  }, [selectedDate]);

  // Get all dates with entries (for calendar indicators)
  const getDatesWithEntries = () => {
    // Mock - in real app, fetch from API
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    return [formatDate(today), formatDate(yesterday)];
  };

  const datesWithEntries = getDatesWithEntries();

  const formatDisplayDate = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const navigateDate = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + direction);
    setSelectedDate(newDate);
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setShowCalendar(false);
  };

  const handleCreateEntry = () => {
    setEditingEntry(null);
    setFormData({
      date: formatDate(selectedDate),
      inspiration: '',
      book: '',
      pencilSet: '',
      palette: '',
      combo: '',
      notes: '',
      tags: '',
      images: [],
      videos: []
    });
    setShowEntryForm(true);
  };

  const handleEditEntry = (entry) => {
    setEditingEntry(entry);
    setFormData({
      date: entry.date,
      inspiration: entry.inspiration?.id || '',
      book: entry.book?.id || '',
      pencilSet: entry.pencilSet?.id || '',
      palette: entry.palette?.id || '',
      combo: entry.combo?.id || '',
      notes: entry.notes || '',
      tags: entry.tags.join(', ') || '',
      images: entry.images || [],
      videos: entry.videos || []
    });
    setShowEntryForm(true);
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const imageFiles = files.map(file => ({
      id: Date.now() + Math.random(),
      file: file,
      preview: URL.createObjectURL(file),
      name: file.name
    }));
    setFormData({
      ...formData,
      images: [...formData.images, ...imageFiles]
    });
  };

  const handleVideoUpload = (e) => {
    const files = Array.from(e.target.files);
    const videoFiles = files.map(file => ({
      id: Date.now() + Math.random(),
      file: file,
      preview: URL.createObjectURL(file),
      name: file.name
    }));
    setFormData({
      ...formData,
      videos: [...formData.videos, ...videoFiles]
    });
  };

  const handleRemoveImage = (imageId) => {
    const image = formData.images.find(img => img.id === imageId);
    if (image && image.preview) {
      URL.revokeObjectURL(image.preview);
    }
    setFormData({
      ...formData,
      images: formData.images.filter(img => img.id !== imageId)
    });
  };

  const handleRemoveVideo = (videoId) => {
    const video = formData.videos.find(vid => vid.id === videoId);
    if (video && video.preview) {
      URL.revokeObjectURL(video.preview);
    }
    setFormData({
      ...formData,
      videos: formData.videos.filter(vid => vid.id !== videoId)
    });
  };

  const handleSaveEntry = () => {
    const entry = {
      id: editingEntry?.id || Date.now(),
      date: formData.date,
      inspiration: inspirations.find(i => i.id === parseInt(formData.inspiration)),
      book: books.find(b => b.id === parseInt(formData.book)),
      pencilSet: pencilSets.find(p => p.id === parseInt(formData.pencilSet)),
      palette: palettes.find(p => p.id === parseInt(formData.palette)),
      combo: combos.find(c => c.id === parseInt(formData.combo)),
      notes: formData.notes,
      tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
      images: formData.images,
      videos: formData.videos
    };

    if (editingEntry) {
      setEntries(entries.map(e => e.id === entry.id ? entry : e));
    } else {
      setEntries([...entries, entry]);
    }
    setShowEntryForm(false);
    setEditingEntry(null);
  };

  const handleDeleteEntry = (entryId) => {
    setEntries(entries.filter(e => e.id !== entryId));
  };

  const getCalendarDays = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push(date);
    }
    
    return days;
  };

  const isSameDate = (date1, date2) => {
    return date1 && date2 &&
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate();
  };

  const isToday = (date) => {
    const today = new Date();
    return isSameDate(date, today);
  };

  const hasEntry = (date) => {
    return datesWithEntries.includes(formatDate(date));
  };

  return (
    <div className="space-y-6">
      {/* Date Navigation Section */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigateDate(-1)}
              className="p-2 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h3 className="text-lg font-semibold text-slate-800 font-venti">{formatDisplayDate(selectedDate)}</h3>
            </div>
            <button
              onClick={() => navigateDate(1)}
              className="p-2 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSelectedDate(new Date())}
              className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => setShowCalendar(!showCalendar)}
              className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors"
              style={{ backgroundColor: '#ea3663' }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#d12a4f'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#ea3663'}
            >
              {showCalendar ? 'Hide Calendar' : 'Show Calendar'}
            </button>
          </div>
        </div>

        {/* Calendar */}
        {showCalendar && (
          <div className="bg-slate-50 rounded-xl shadow-sm border border-slate-200 p-4 mt-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-slate-800 font-venti">
                {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h4>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    const newDate = new Date(selectedDate);
                    newDate.setMonth(newDate.getMonth() - 1);
                    setSelectedDate(newDate);
                  }}
                  className="p-1 rounded hover:bg-slate-100"
                >
                  <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    const newDate = new Date(selectedDate);
                    newDate.setMonth(newDate.getMonth() + 1);
                    setSelectedDate(newDate);
                  }}
                  className="p-1 rounded hover:bg-slate-100"
                >
                  <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-xs font-medium text-slate-600 text-center p-2">
                  {day}
                </div>
              ))}
              {getCalendarDays().map((date, index) => (
                <button
                  key={index}
                  onClick={() => date && handleDateSelect(date)}
                  className={`p-2 rounded text-sm transition-all ${
                    !date
                      ? 'cursor-default'
                      : isSameDate(date, selectedDate)
                      ? 'bg-slate-800 text-white font-semibold'
                      : isToday(date)
                      ? 'bg-slate-100 font-medium'
                      : hasEntry(date)
                      ? 'bg-white hover:bg-slate-100 border-2 border-slate-300'
                      : 'hover:bg-white'
                  }`}
                >
                  {date ? (
                    <div className="flex flex-col items-center">
                      <span>{date.getDate()}</span>
                      {hasEntry(date) && (
                        <span className="w-1 h-1 rounded-full mt-0.5" style={{ backgroundColor: '#ea3663' }}></span>
                      )}
                    </div>
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Entries Section */}
      <div className="bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800 font-venti">Journal Entries</h3>
          <button
            onClick={handleCreateEntry}
            className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors flex items-center space-x-2"
            style={{ backgroundColor: '#ea3663' }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#d12a4f'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#ea3663'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>New Entry</span>
          </button>
        </div>

        {entries.length === 0 ? (
          <div className="bg-slate-50 rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <div className="text-6xl mb-4">📔</div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2 font-venti">No Entries Yet</h3>
            <p className="text-slate-600 mb-4">Create your first journal entry for this date</p>
            <button
              onClick={handleCreateEntry}
              className="px-6 py-3 text-white rounded-lg font-medium transition-colors"
              style={{ backgroundColor: '#ea3663' }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#d12a4f'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#ea3663'}
            >
              Create Entry
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="bg-slate-50 rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all"
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#ea3663'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {entry.inspiration && (
                        <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs">
                          📚 {entry.inspiration.title}
                        </span>
                      )}
                      {entry.book && (
                        <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs">
                          📖 {entry.book.title}
                        </span>
                      )}
                      {entry.pencilSet && (
                        <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs">
                          ✏️ {entry.pencilSet.name}
                        </span>
                      )}
                      {entry.palette && (
                        <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs">
                          🌈 {entry.palette.name}
                        </span>
                      )}
                      {entry.combo && (
                        <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs">
                          🎨 {entry.combo.name}
                        </span>
                      )}
                    </div>
                    {entry.notes && (
                      <p className="text-slate-700 mb-3">{entry.notes}</p>
                    )}
                    {entry.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {entry.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-white text-slate-600 rounded text-xs border border-slate-200"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {/* Images */}
                    {entry.images && entry.images.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                        {entry.images.map((image, index) => (
                          <div key={index} className="relative">
                            <img
                              src={image.preview || image.url}
                              alt={image.name || `Image ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg border border-slate-200"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Videos */}
                    {entry.videos && entry.videos.length > 0 && (
                      <div className="space-y-3">
                        {entry.videos.map((video, index) => (
                          <div key={index} className="relative">
                            <video
                              src={video.preview || video.url}
                              controls
                              className="w-full rounded-lg border border-slate-200"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleEditEntry(entry)}
                      className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteEntry(entry.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Entry Form Modal */}
      {showEntryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-50 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-800 font-venti">
                  {editingEntry ? 'Edit Entry' : 'New Entry'}
                </h3>
                <button
                  onClick={() => {
                    setShowEntryForm(false);
                    setEditingEntry(null);
                  }}
                  className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{ focusRingColor: '#ea3663' }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Inspiration</label>
                  <DropdownMenu
                    label="Inspiration"
                    options={inspirations.map(item => ({
                      value: item.id.toString(),
                      label: item.title
                    }))}
                    value={formData.inspiration}
                    onChange={(value) => setFormData({ ...formData, inspiration: value })}
                    placeholder="Select inspiration..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Book</label>
                  <DropdownMenu
                    label="Book"
                    options={books.map(book => ({
                      value: book.id.toString(),
                      label: book.title
                    }))}
                    value={formData.book}
                    onChange={(value) => setFormData({ ...formData, book: value })}
                    placeholder="Select book..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Pencil Set</label>
                  <DropdownMenu
                    label="Pencil Set"
                    options={pencilSets.map(set => ({
                      value: set.id.toString(),
                      label: set.name
                    }))}
                    value={formData.pencilSet}
                    onChange={(value) => setFormData({ ...formData, pencilSet: value })}
                    placeholder="Select pencil set..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Color Palette</label>
                  <DropdownMenu
                    label="Color Palette"
                    options={palettes.map(palette => ({
                      value: palette.id.toString(),
                      label: palette.name
                    }))}
                    value={formData.palette}
                    onChange={(value) => setFormData({ ...formData, palette: value })}
                    placeholder="Select palette..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Color Combo</label>
                  <DropdownMenu
                    label="Color Combo"
                    options={combos.map(combo => ({
                      value: combo.id.toString(),
                      label: combo.name
                    }))}
                    value={formData.combo}
                    onChange={(value) => setFormData({ ...formData, combo: value })}
                    placeholder="Select combo..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{ focusRingColor: '#ea3663' }}
                  placeholder="Write your notes here..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{ focusRingColor: '#ea3663' }}
                  placeholder="e.g., relaxing, floral, watercolor"
                />
              </div>

              {/* Images Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Images</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{ focusRingColor: '#ea3663' }}
                />
                {formData.images.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {formData.images.map((image) => (
                      <div key={image.id} className="relative group">
                        <img
                          src={image.preview}
                          alt={image.name}
                          className="w-full h-32 object-cover rounded-lg border border-slate-200"
                        />
                        <button
                          onClick={() => handleRemoveImage(image.id)}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Videos Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Videos</label>
                <input
                  type="file"
                  accept="video/*"
                  multiple
                  onChange={handleVideoUpload}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{ focusRingColor: '#ea3663' }}
                />
                {formData.videos.length > 0 && (
                  <div className="mt-3 space-y-3">
                    {formData.videos.map((video) => (
                      <div key={video.id} className="relative group">
                        <video
                          src={video.preview}
                          controls
                          className="w-full rounded-lg border border-slate-200"
                        />
                        <button
                          onClick={() => handleRemoveVideo(video.id)}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowEntryForm(false);
                    setEditingEntry(null);
                  }}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEntry}
                  className="px-4 py-2 text-white rounded-lg font-medium transition-colors"
                  style={{ backgroundColor: '#ea3663' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#d12a4f'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#ea3663'}
                >
                  Save Entry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColoristLog;

