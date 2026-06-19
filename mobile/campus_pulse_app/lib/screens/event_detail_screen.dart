import 'package:flutter/material.dart';

import '../models/event.dart';
import '../utils/constants.dart';

class EventDetailScreen extends StatelessWidget {
  final CampusEvent event;

  const EventDetailScreen({
    super.key,
    required this.event,
  });

  DateTime get eventDate {
    return DateTime.fromMillisecondsSinceEpoch(event.datetime * 1000);
  }

  String get formattedDate {
    final hour = eventDate.hour;
    final minute = eventDate.minute.toString().padLeft(2, '0');
    final period = hour >= 12 ? 'PM' : 'AM';
    final displayHour = hour % 12 == 0 ? 12 : hour % 12;

    return '${eventDate.month}/${eventDate.day}/${eventDate.year}, $displayHour:$minute $period';
  }

  String get imageUrl {
    if (event.image == null || event.image!.isEmpty) {
      return '';
    }

    return '${AppConstants.assetsBaseUrl}${event.image}';
  }

  String titleCase(String text) {
    return text
        .split(' ')
        .map((word) {
          if (word.isEmpty) return word;
          return word[0].toUpperCase() + word.substring(1).toLowerCase();
        })
        .join(' ');
  }

  String? get actionButtonText {
    switch (event.action) {
      case 'discord':
        return 'Discord';
      case 'instagram':
        return 'Instagram';
      case 'contact':
        return 'Contact';
      case 'custom':
        return event.actionLabel ?? 'Website';
      case 'rsvp':
        return 'RSVP';
      default:
        return null;
    }
  }

  void _handleAction(BuildContext context) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('${actionButtonText ?? "Action"} support coming next'),
      ),
    );
  }

  void _handleMap(BuildContext context) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Show ${event.title} on map coming next'),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final actionText = actionButtonText;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Event Details'),
      ),
      body: ListView(
        children: [
          imageUrl.isEmpty
              ? Container(
                  height: 240,
                  width: double.infinity,
                  color: theme.colorScheme.surfaceContainerHighest,
                  child: Icon(
                    Icons.event,
                    size: 72,
                    color: theme.colorScheme.primary,
                  ),
                )
              : Image.network(
                  imageUrl,
                  height: 240,
                  width: double.infinity,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) {
                    return Container(
                      height: 240,
                      width: double.infinity,
                      color: theme.colorScheme.surfaceContainerHighest,
                      child: Icon(
                        Icons.broken_image,
                        size: 72,
                        color: theme.colorScheme.primary,
                      ),
                    );
                  },
                ),
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  event.title,
                  style: theme.textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Icon(
                      Icons.location_on_outlined,
                      size: 20,
                      color: theme.colorScheme.primary,
                    ),
                    const SizedBox(width: 6),
                    Expanded(child: Text(event.location)),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Icon(
                      Icons.schedule,
                      size: 20,
                      color: theme.colorScheme.primary,
                    ),
                    const SizedBox(width: 6),
                    Expanded(child: Text(formattedDate)),
                  ],
                ),
                const SizedBox(height: 18),
                Text(
                  'Posted by @${event.createdByUsername}',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: theme.colorScheme.primary,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 22),
                Text(
                  event.description.isEmpty
                      ? 'No description available.'
                      : event.description,
                  style: theme.textTheme.bodyLarge,
                ),
                const SizedBox(height: 22),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: event.tags.map((tag) {
                    return Chip(
                      label: Text(titleCase(tag)),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 28),
                Row(
                  children: [
                    if (actionText != null) ...[
                      Expanded(
                        child: FilledButton(
                          onPressed: () => _handleAction(context),
                          child: Text(actionText),
                        ),
                      ),
                      const SizedBox(width: 12),
                    ],
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () => _handleMap(context),
                        icon: const Icon(Icons.map_outlined),
                        label: const Text('Show on Map'),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}