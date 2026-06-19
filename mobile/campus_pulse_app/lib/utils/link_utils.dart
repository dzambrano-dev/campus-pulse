import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';


class LinkUtils {
  static Future<void> openEventAction({
    required BuildContext context,
    required String? action,
    required String? actionLink,
  }) async {
    final cleanAction = action?.trim().toLowerCase();
    final cleanLink = actionLink?.trim();

    if (cleanAction == null || cleanAction.isEmpty || cleanAction == 'rsvp') {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('RSVP support is coming soon.'),
        ),
      );
      return;
    }

    if (cleanLink == null || cleanLink.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('No link available for this event.'),
        ),
      );
      return;
    }

    Uri uri;

    if (cleanAction == 'contact') {
      uri = Uri(
        scheme: 'mailto',
        path: cleanLink,
      );
    } else {
      final normalizedLink = cleanLink.startsWith('http')
          ? cleanLink
          : 'https://$cleanLink';

      uri = Uri.parse(normalizedLink);
    }

    final opened = await launchUrl(
      uri,
      mode: LaunchMode.externalApplication,
    );

    if (!opened && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Could not open this link.'),
        ),
      );
    }
  }

  static String actionButtonText({
    required String? action,
    required String? actionLabel,
  }) {
    final cleanAction = action?.trim().toLowerCase();

    if (actionLabel != null && actionLabel.trim().isNotEmpty) {
      return actionLabel.trim();
    }

    switch (cleanAction) {
      case 'contact':
        return 'Contact';
      case 'discord':
        return 'Open Discord';
      case 'instagram':
        return 'Open Instagram';
      case 'custom':
        return 'Learn More';
      case 'rsvp':
        return 'RSVP';
      default:
        return 'Action';
    }
  }
}