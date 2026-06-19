import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';

import '../models/event.dart';
import '../services/event_service.dart';
import 'event_detail_screen.dart';

class MapScreen extends StatefulWidget {
  final bool isDarkMode;
  final CampusEvent? selectedEvent;

  const MapScreen({
    super.key,
    required this.isDarkMode,
    this.selectedEvent,
  });

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  final EventService _eventService = EventService();
  final MapController _mapController = MapController();

  late Future<List<CampusEvent>> _eventsFuture;

  LatLng? _userLocation;
  bool _labelsVisible = false;

  static const LatLng _csulbCenter = LatLng(33.7838, -118.1141);

  @override
  void initState() {
    super.initState();
    _eventsFuture = _loadEvents();
    _locateUser();
  }

  @override
  void didUpdateWidget(covariant MapScreen oldWidget) {
    super.didUpdateWidget(oldWidget);

    if (widget.selectedEvent?.id != oldWidget.selectedEvent?.id) {
      _centerOnSelectedEvent();
    }
  }

  Future<List<CampusEvent>> _loadEvents() async {
    try {
      return await _eventService.fetchEvents();
    } catch (_) {
      return _eventService.demoEvents();
    }
  }

  Future<void> _locateUser() async {
    try {
      final serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) return;

      LocationPermission permission = await Geolocator.checkPermission();

      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }

      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        return;
      }

      final position = await Geolocator.getCurrentPosition();

      if (!mounted) return;

      setState(() {
        _userLocation = LatLng(position.latitude, position.longitude);
      });
    } catch (_) {
      // Ignore location errors for now.
    }
  }

  Color _categoryColor(String type) {
    switch (type.toLowerCase().trim()) {
      case 'academics':
        return const Color(0xFF3B82F6);
      case 'alert':
        return const Color(0xFFEF4444);
      case 'athletics':
        return const Color(0xFF22C55E);
      case 'career':
        return const Color(0xFF8B5CF6);
      case 'social':
        return const Color(0xFFEC4899);
      case 'club':
      default:
        return const Color(0xFFEAB308);
    }
  }

  IconData _categoryIcon(String type) {
    switch (type.toLowerCase().trim()) {
      case 'academics':
        return Icons.menu_book;
      case 'alert':
        return Icons.warning_rounded;
      case 'athletics':
        return Icons.sports_basketball;
      case 'career':
        return Icons.work;
      case 'social':
        return Icons.chat_bubble;
      case 'club':
      default:
        return Icons.groups;
    }
  }

  String _formatEventTime(int timestamp) {
    final date = DateTime.fromMillisecondsSinceEpoch(timestamp * 1000);
    final hour = date.hour;
    final minute = date.minute.toString().padLeft(2, '0');
    final period = hour >= 12 ? 'PM' : 'AM';
    final displayHour = hour % 12 == 0 ? 12 : hour % 12;

    return '${date.month}/${date.day}, $displayHour:$minute $period';
  }

  void _showEventPopup(CampusEvent event) {
    showModalBottomSheet(
      context: context,
      showDragHandle: true,
      builder: (context) {
        final color = _categoryColor(event.type);

        return Padding(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                event.title,
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 8),
              Text(event.location),
              const SizedBox(height: 4),
              Text(_formatEventTime(event.datetime)),
              const SizedBox(height: 18),
              FilledButton(
                style: FilledButton.styleFrom(
                  backgroundColor: color,
                  foregroundColor: Colors.white,
                ),
                onPressed: () {
                  Navigator.pop(context);

                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => EventDetailScreen(event: event),
                    ),
                  );
                },
                child: const Text('View Event'),
              ),
            ],
          ),
        );
      },
    );
  }

  Marker _buildEventMarker(CampusEvent event) {
    final point = LatLng(event.lat!, event.lng!);
    final color = _categoryColor(event.type);
    final icon = _categoryIcon(event.type);

    return Marker(
      point: point,
      width: _labelsVisible ? 140 : 48,
      height: _labelsVisible ? 78 : 48,
      child: GestureDetector(
        onTap: () => _showEventPopup(event),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                color: color,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    blurRadius: 8,
                    color: Colors.black.withValues(alpha: 0.25),
                  ),
                ],
              ),
              child: Icon(
                icon,
                color: Colors.white,
                size: 24,
              ),
            ),
            if (_labelsVisible) ...[
              const SizedBox(height: 4),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 8,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.surface,
                  borderRadius: BorderRadius.circular(999),
                  boxShadow: [
                    BoxShadow(
                      blurRadius: 6,
                      color: Colors.black.withValues(alpha: 0.18),
                    ),
                  ],
                ),
                child: Text(
                  event.title,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.labelSmall,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Marker? _buildUserMarker() {
    if (_userLocation == null) return null;

    return Marker(
      point: _userLocation!,
      width: _labelsVisible ? 100 : 44,
      height: _labelsVisible ? 72 : 44,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 34,
            height: 34,
            decoration: BoxDecoration(
              color: Colors.blue,
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white, width: 3),
              boxShadow: [
                BoxShadow(
                  blurRadius: 8,
                  color: Colors.black.withValues(alpha: 0.25),
                ),
              ],
            ),
            child: const Icon(
              Icons.person,
              color: Colors.white,
              size: 18,
            ),
          ),
          if (_labelsVisible) ...[
            const SizedBox(height: 4),
            Container(
              padding: const EdgeInsets.symmetric(
                horizontal: 8,
                vertical: 4,
              ),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surface,
                borderRadius: BorderRadius.circular(999),
              ),
              child: const Text('You'),
            ),
          ],
        ],
      ),
    );
  }

  void _centerOnSelectedEvent() {
  final event = widget.selectedEvent;

  if (event == null || event.lat == null || event.lng == null) {
    return;
  }

  final point = LatLng(event.lat!, event.lng!);

  WidgetsBinding.instance.addPostFrameCallback((_) {
    if (!mounted) return;

    _mapController.move(point, 17);
    _showEventPopup(event);
  });
}

  @override
  Widget build(BuildContext context) {
    final tileUrl = widget.isDarkMode
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

    return Stack(
      children: [
        FutureBuilder<List<CampusEvent>>(
          future: _eventsFuture,
          builder: (context, snapshot) {
            final events = snapshot.data ?? [];

            final eventMarkers = events
                .where((event) => event.lat != null && event.lng != null)
                .map(_buildEventMarker)
                .toList();

            final userMarker = _buildUserMarker();

            final markers = [
              ...eventMarkers,
              if (userMarker != null) userMarker,
            ];

            return FlutterMap(
              mapController: _mapController,
              options: const MapOptions(
                initialCenter: _csulbCenter,
                initialZoom: 16,
              ),
              children: [
                TileLayer(
                  urlTemplate: tileUrl,
                  userAgentPackageName: 'com.example.campus_pulse_app',
                ),
                MarkerLayer(
                  markers: markers,
                ),
              ],
            );
          },
        ),
        Positioned(
          top: 16,
          right: 16,
          child: FloatingActionButton.small(
            heroTag: 'toggle-labels',
            onPressed: () {
              setState(() {
                _labelsVisible = !_labelsVisible;
              });
            },
            child: Icon(
              _labelsVisible ? Icons.label_off : Icons.label,
            ),
          ),
        ),
        Positioned(
          top: 72,
          right: 16,
          child: FloatingActionButton.small(
            heroTag: 'locate-user',
            onPressed: _locateUser,
            child: const Icon(Icons.my_location),
          ),
        ),
      ],
    );
  }
}