import 'package:flutter/material.dart';

import '../models/event.dart';
import '../utils/constants.dart';

class EventCard extends StatelessWidget {
  final CampusEvent event;
  final VoidCallback? onDetailsTap;
  final VoidCallback? onMapTap;

  const EventCard({
    super.key,
    required this.event,
    this.onDetailsTap,
    this.onMapTap,
  });

  String get imageUrl {
    if (event.image == null || event.image!.isEmpty) {
      return '';
    }

    return '${AppConstants.assetsBaseUrl}${event.image}';
  }

  DateTime get eventDate {
    return DateTime.fromMillisecondsSinceEpoch(event.datetime * 1000);
  }

  String get monthShort {
    const months = [
      'JAN',
      'FEB',
      'MAR',
      'APR',
      'MAY',
      'JUN',
      'JUL',
      'AUG',
      'SEP',
      'OCT',
      'NOV',
      'DEC',
    ];

    return months[eventDate.month - 1];
  }

  String get formattedDate {
    final hour = eventDate.hour;
    final minute = eventDate.minute.toString().padLeft(2, '0');
    final period = hour >= 12 ? 'PM' : 'AM';
    final displayHour = hour % 12 == 0 ? 12 : hour % 12;

    return '${eventDate.month}/${eventDate.day}, $displayHour:$minute $period';
  }

  String get shortDescription {
    const maxLength = 200;

    if (event.description.length <= maxLength) {
      return event.description;
    }

    return '${event.description.substring(0, maxLength).trim()}...';
  }

  String titleCase(String text) {
    return text
        .split(' ')
        .map((word) {
          if (word.isEmpty) return word;
          return word[0].toUpperCase() + word.substring(1);
        })
        .join(' ');
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      clipBehavior: Clip.antiAlias,
      margin: const EdgeInsets.only(bottom: 18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Stack(
            children: [
              imageUrl.isEmpty
                  ? Container(
                      height: 170,
                      width: double.infinity,
                      color: theme.colorScheme.surfaceContainerHighest,
                      child: Icon(
                        Icons.event,
                        size: 56,
                        color: theme.colorScheme.primary,
                      ),
                    )
                  : Image.network(
                      imageUrl,
                      height: 170,
                      width: double.infinity,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) {
                        return Container(
                          height: 170,
                          width: double.infinity,
                          color: theme.colorScheme.surfaceContainerHighest,
                          child: Icon(
                            Icons.broken_image,
                            size: 56,
                            color: theme.colorScheme.primary,
                          ),
                        );
                      },
                    ),
              Positioned(
                top: 12,
                left: 12,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 8,
                  ),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.surface,
                    borderRadius: BorderRadius.circular(14),
                    boxShadow: [
                      BoxShadow(
                        blurRadius: 8,
                        color: Colors.black.withValues(alpha: 0.16),
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      Text(
                        monthShort,
                        style: theme.textTheme.labelSmall?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: theme.colorScheme.primary,
                        ),
                      ),
                      Text(
                        eventDate.day.toString(),
                        style: theme.textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          Padding(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  event.title,
                  style: theme.textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                Wrap(
                  crossAxisAlignment: WrapCrossAlignment.center,
                  spacing: 8,
                  children: [
                    Icon(
                      Icons.location_on_outlined,
                      size: 18,
                      color: theme.colorScheme.primary,
                    ),
                    Text(event.location),
                    const Text('•'),
                    Text(formattedDate),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  'Posted by @${event.createdByUsername}',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.primary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 12),
                Text(shortDescription),
                const SizedBox(height: 14),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: event.tags.map((tag) {
                    return Chip(
                      label: Text(titleCase(tag)),
                      visualDensity: VisualDensity.compact,
                    );
                  }).toList(),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: FilledButton(
                        onPressed: onDetailsTap,
                        child: const Text('See Details'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: OutlinedButton(
                        onPressed: onMapTap,
                        child: const Text('Show on Map'),
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