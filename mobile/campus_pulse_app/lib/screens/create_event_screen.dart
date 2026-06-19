import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:image_picker/image_picker.dart';
import 'package:latlong2/latlong.dart';

import '../services/event_creation_service.dart';
import '../services/interests_service.dart';

class CreateEventScreen extends StatefulWidget {
  final bool isDarkMode;

  const CreateEventScreen({
    super.key,
    required this.isDarkMode,
  });

  @override
  State<CreateEventScreen> createState() => _CreateEventScreenState();
}

class _CreateEventScreenState extends State<CreateEventScreen> {
  final _formKey = GlobalKey<FormState>();

  final _creationService = EventCreationService();
  final _interestsService = InterestsService();
  final _imagePicker = ImagePicker();

  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _locationController = TextEditingController();
  final _actionLinkController = TextEditingController();
  final _actionLabelController = TextEditingController();

  String? _selectedType;
  String? _selectedAction;

  DateTime? _selectedDate;
  TimeOfDay? _selectedTime;
  LatLng? _selectedPin;
  XFile? _selectedImage;

  bool _isSubmitting = false;

  late Future<List<String>> _tagsFuture;
  final Set<String> _selectedTags = {};

  static const LatLng _csulbCenter = LatLng(33.7838, -118.1141);

  final List<String> _eventTypes = const [
    'alert',
    'academics',
    'athletics',
    'career',
    'club',
    'social',
  ];

  final List<String> _actions = const [
    '',
    'rsvp',
    'contact',
    'discord',
    'instagram',
    'custom',
  ];

  @override
  void initState() {
    super.initState();
    _tagsFuture = _loadTags();
  }

  Future<List<String>> _loadTags() async {
    try {
      return await _interestsService.fetchAvailableInterests();
    } catch (_) {
      return _interestsService.demoAvailableInterests();
    }
  }

  String _titleCase(String text) {
    return text
        .split(' ')
        .map((word) {
          if (word.isEmpty) return word;
          return word[0].toUpperCase() + word.substring(1);
        })
        .join(' ');
  }

  String _actionLabel(String action) {
    if (action.isEmpty) return 'None';
    return _titleCase(action);
  }

  Future<void> _pickDate() async {
    final now = DateTime.now();

    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate ?? now,
      firstDate: now,
      lastDate: DateTime(now.year + 3),
    );

    if (picked == null) return;

    setState(() {
      _selectedDate = picked;
    });
  }

  Future<void> _pickTime() async {
    final picked = await showTimePicker(
      context: context,
      initialTime: _selectedTime ?? TimeOfDay.now(),
    );

    if (picked == null) return;

    setState(() {
      _selectedTime = picked;
    });
  }

  Future<void> _pickImage() async {
    try {
      final image = await _imagePicker.pickImage(
        source: ImageSource.gallery,
        imageQuality: 90,
      );

      if (!mounted) return;

      if (image == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('No image selected')),
        );
        return;
      }

      setState(() {
        _selectedImage = image;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Selected: ${image.name}')),
      );
    } catch (error) {
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Image picker error: $error')),
      );
    }
  }

  void _toggleTag(String tag) {
    final normalized = tag.toLowerCase();

    setState(() {
      if (_selectedTags.contains(normalized)) {
        _selectedTags.remove(normalized);
        return;
      }

      if (_selectedTags.length >= 3) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('You can select at most 3 tags')),
        );
        return;
      }

      _selectedTags.add(normalized);
    });
  }

  String? _validateActionLink() {
    final action = _selectedAction;

    if (action == null || action.isEmpty || action == 'rsvp') {
      return null;
    }

    final rawLink = _actionLinkController.text.trim();

    if (rawLink.isEmpty) {
      return 'Please provide a link';
    }

    final emailRegex = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');

    if (action == 'contact' && !emailRegex.hasMatch(rawLink)) {
      return 'Enter a valid email';
    }

    if (action == 'custom' && _actionLabelController.text.trim().isEmpty) {
      return 'Please provide a button label';
    }

    return null;
  }

  int _buildTimestamp() {
    final date = _selectedDate!;
    final time = _selectedTime!;

    final combined = DateTime(
      date.year,
      date.month,
      date.day,
      time.hour,
      time.minute,
    );

    return combined.millisecondsSinceEpoch ~/ 1000;
  }

  String? _normalizedActionLink() {
    final action = _selectedAction;

    if (action == null || action.isEmpty || action == 'rsvp') {
      return null;
    }

    var link = _actionLinkController.text.trim();

    if (['discord', 'instagram', 'custom'].contains(action)) {
      if (!link.startsWith('http')) {
        link = 'https://$link';
      }
    }

    return link;
  }

  Future<void> _submitEvent() async {
    FocusScope.of(context).unfocus();

    if (!_formKey.currentState!.validate()) return;

    if (_selectedDate == null || _selectedTime == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Date and time are required')),
      );
      return;
    }

    if (_selectedTags.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select at least one tag')),
      );
      return;
    }

    if (_selectedPin == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please place a pin on the map')),
      );
      return;
    }

    if (_selectedImage == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Event image is required')),
      );
      return;
    }

    final actionError = _validateActionLink();
    if (actionError != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(actionError)),
      );
      return;
    }

    setState(() {
      _isSubmitting = true;
    });

    final eventObject = {
      'title': _titleController.text.trim(),
      'description': _descriptionController.text.trim(),
      'type': _selectedType,
      'tags': _selectedTags.toList(),
      'datetime': _buildTimestamp(),
      'location': _locationController.text.trim(),
      'action': _selectedAction?.isEmpty == true ? null : _selectedAction,
      'actionLink': _normalizedActionLink(),
      'actionLabel': _selectedAction == 'custom'
          ? _actionLabelController.text.trim()
          : null,
      'lat': _selectedPin!.latitude,
      'lng': _selectedPin!.longitude,

      // Temporary placeholder.
      // Later we will convert the picked image to base64/webp like the web app.
      'image': null,
    };

    try {
      await _creationService.createEvent(eventObject);

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Event created')),
      );

      _resetForm();
    } catch (_) {
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Create failed for now. Auth/image wiring comes next.'),
        ),
      );
    } finally {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
        });
      }
    }
  }

  void _resetForm() {
    _formKey.currentState?.reset();

    _titleController.clear();
    _descriptionController.clear();
    _locationController.clear();
    _actionLinkController.clear();
    _actionLabelController.clear();

    setState(() {
      _selectedType = null;
      _selectedAction = null;
      _selectedDate = null;
      _selectedTime = null;
      _selectedPin = null;
      _selectedImage = null;
      _selectedTags.clear();
    });
  }

  Widget _buildMapPicker() {
    final tileUrl = widget.isDarkMode
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

    return SizedBox(
      height: 260,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(18),
        child: FlutterMap(
          options: MapOptions(
            initialCenter: _csulbCenter,
            initialZoom: 15,
            onTap: (tapPosition, point) {
              setState(() {
                _selectedPin = point;
              });
            },
          ),
          children: [
            TileLayer(
              urlTemplate: tileUrl,
              userAgentPackageName: 'com.example.campus_pulse_app',
            ),
            if (_selectedPin != null)
              MarkerLayer(
                markers: [
                  Marker(
                    point: _selectedPin!,
                    width: 44,
                    height: 44,
                    child: const Icon(
                      Icons.location_on,
                      color: Colors.red,
                      size: 44,
                    ),
                  ),
                ],
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildTagPicker() {
    return FutureBuilder<List<String>>(
      future: _tagsFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const LinearProgressIndicator();
        }

        final tags = snapshot.data ?? [];

        return Wrap(
          spacing: 8,
          runSpacing: 8,
          children: tags.map((tag) {
            final normalized = tag.toLowerCase();
            final selected = _selectedTags.contains(normalized);

            return FilterChip(
              label: Text(_titleCase(tag)),
              selected: selected,
              onSelected: (_) => _toggleTag(tag),
            );
          }).toList(),
        );
      },
    );
  }

  Widget _buildActionFields() {
    final action = _selectedAction;

    if (action == null || action.isEmpty || action == 'rsvp') {
      return const SizedBox.shrink();
    }

    String placeholder = 'Website link';

    if (action == 'contact') {
      placeholder = 'Email address';
    } else if (action == 'discord') {
      placeholder = 'Discord invite link';
    } else if (action == 'instagram') {
      placeholder = 'Instagram link';
    }

    return Column(
      children: [
        if (action == 'custom') ...[
          TextFormField(
            controller: _actionLabelController,
            decoration: const InputDecoration(
              labelText: 'Button text',
              hintText: 'e.g. Learn More',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 14),
        ],
        TextFormField(
          controller: _actionLinkController,
          decoration: InputDecoration(
            labelText: placeholder,
            border: const OutlineInputBorder(),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final dateLabel = _selectedDate == null
        ? 'Choose Date'
        : '${_selectedDate!.month}/${_selectedDate!.day}/${_selectedDate!.year}';

    final timeLabel = _selectedTime == null
        ? 'Choose Time'
        : _selectedTime!.format(context);

    return Form(
      key: _formKey,
      child: ListView(
        padding: const EdgeInsets.all(18),
        children: [
          Text(
            'Create an Event',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),
          const SizedBox(height: 18),
          TextFormField(
            controller: _titleController,
            decoration: const InputDecoration(
              labelText: 'Event Title',
              border: OutlineInputBorder(),
            ),
            validator: (value) {
              if (value == null || value.trim().isEmpty) {
                return 'Event title is required';
              }
              return null;
            },
          ),
          const SizedBox(height: 14),
          TextFormField(
            controller: _descriptionController,
            maxLength: 500,
            maxLines: 5,
            decoration: const InputDecoration(
              labelText: 'Description',
              border: OutlineInputBorder(),
            ),
            validator: (value) {
              final text = value?.trim() ?? '';
              if (text.length < 50) {
                return 'Description must be at least 50 characters';
              }
              return null;
            },
          ),
          const SizedBox(height: 14),
          DropdownButtonFormField<String>(
            value: _selectedType,
            decoration: const InputDecoration(
              labelText: 'Event Type',
              border: OutlineInputBorder(),
            ),
            items: _eventTypes.map((type) {
              return DropdownMenuItem(
                value: type,
                child: Text(_titleCase(type)),
              );
            }).toList(),
            onChanged: (value) {
              setState(() {
                _selectedType = value;
              });
            },
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Please select an event type';
              }
              return null;
            },
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _pickDate,
                  icon: const Icon(Icons.calendar_month),
                  label: Text(dateLabel),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _pickTime,
                  icon: const Icon(Icons.schedule),
                  label: Text(timeLabel),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          TextFormField(
            controller: _locationController,
            decoration: const InputDecoration(
              labelText: 'Location',
              border: OutlineInputBorder(),
            ),
            validator: (value) {
              if (value == null || value.trim().isEmpty) {
                return 'Please provide a location';
              }
              return null;
            },
          ),
          const SizedBox(height: 14),
          DropdownButtonFormField<String>(
            value: _selectedAction,
            decoration: const InputDecoration(
              labelText: 'Call to Action',
              border: OutlineInputBorder(),
            ),
            items: _actions.map((action) {
              return DropdownMenuItem(
                value: action,
                child: Text(_actionLabel(action)),
              );
            }).toList(),
            onChanged: (value) {
              setState(() {
                _selectedAction = value;
                _actionLinkController.clear();
                _actionLabelController.clear();
              });
            },
          ),
          const SizedBox(height: 14),
          _buildActionFields(),
          const SizedBox(height: 18),
          Text(
            'Click map to place a pin',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 8),
          _buildMapPicker(),
          const SizedBox(height: 18),
          OutlinedButton.icon(
            onPressed: _pickImage,
            icon: const Icon(Icons.image),
            label: Text(
              _selectedImage == null
                  ? 'Choose Event Image'
                  : _selectedImage!.name,
            ),
          ),
          const SizedBox(height: 18),
          Text(
            'Tags',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 8),
          _buildTagPicker(),
          const SizedBox(height: 24),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: _isSubmitting ? null : _resetForm,
                  child: const Text('Reset'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: FilledButton(
                  onPressed: _isSubmitting ? null : _submitEvent,
                  child: Text(_isSubmitting ? 'Creating...' : 'Create'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}