import 'package:flutter/material.dart';

import '../models/event.dart';
import '../services/event_service.dart';
import '../widgets/event_card.dart';

import 'event_detail_screen.dart';

class EventsScreen extends StatefulWidget {
  final void Function(CampusEvent event)? onShowOnMap;

  const EventsScreen({
    super.key,
    this.onShowOnMap,
  });

  @override
  State<EventsScreen> createState() => _EventsScreenState();
}

class _EventsScreenState extends State<EventsScreen> {
  final EventService _eventService = EventService();

  late Future<List<CampusEvent>> _eventsFuture;

  @override
  void initState() {
    super.initState();
    _eventsFuture = _loadEvents();
  }

  Future<List<CampusEvent>> _loadEvents() async {
    try {
      return await _eventService.fetchEvents();
    } catch (_) {
      return _eventService.demoEvents();
    }
  }

  Future<void> _refreshEvents() async {
    setState(() {
      _eventsFuture = _loadEvents();
    });
  }

  void _showDetails(CampusEvent event) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => EventDetailScreen(event: event),
      ),
    );
  }

  void _showOnMap(CampusEvent event) {
    widget.onShowOnMap?.call(event);
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _refreshEvents,
      child: FutureBuilder<List<CampusEvent>>(
        future: _eventsFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(
              child: CircularProgressIndicator(),
            );
          }

          final events = snapshot.data ?? [];

          if (events.isEmpty) {
            return ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(24),
              children: const [
                SizedBox(height: 120),
                Icon(Icons.event_busy, size: 64),
                SizedBox(height: 16),
                Text(
                  'No events for your interests',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
                SizedBox(height: 8),
                Text(
                  'Try adding more interests to discover events around you.',
                  textAlign: TextAlign.center,
                ),
              ],
            );
          }

          return ListView.builder(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(16),
            itemCount: events.length,
            itemBuilder: (context, index) {
              final event = events[index];

              return EventCard(
                event: event,
                onDetailsTap: () => _showDetails(event),
                onMapTap: () => _showOnMap(event),
              );
            },
          );
        },
      ),
    );
  }
}