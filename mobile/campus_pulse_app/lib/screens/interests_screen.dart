import 'package:flutter/material.dart';

import '../services/interests_service.dart';

class InterestsScreen extends StatefulWidget {
  final List<String> initialInterests;

  const InterestsScreen({
    super.key,
    this.initialInterests = const [],
  });

  @override
  State<InterestsScreen> createState() => _InterestsScreenState();
}

class _InterestsScreenState extends State<InterestsScreen> {
  final InterestsService _interestsService = InterestsService();

  late Future<List<String>> _availableInterestsFuture;
  late Set<String> _selectedInterests;

  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _selectedInterests = widget.initialInterests
        .map((interest) => interest.toLowerCase())
        .toSet();

    _availableInterestsFuture = _loadAvailableInterests();
  }

  Future<List<String>> _loadAvailableInterests() async {
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

  void _toggleInterest(String interest) {
    final normalized = interest.toLowerCase();

    setState(() {
      if (_selectedInterests.contains(normalized)) {
        _selectedInterests.remove(normalized);
      } else {
        _selectedInterests.add(normalized);
      }
    });
  }

  Future<void> _saveInterests() async {
    setState(() {
      _isSaving = true;
    });

    final selected = _selectedInterests.toList()..sort();

    try {
      await _interestsService.updateInterests(selected);

      if (!mounted) return;

      Navigator.pop(context, selected);
    } catch (_) {
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Saved locally for now. Real save needs auth wiring.'),
        ),
      );

      Navigator.pop(context, selected);
    } finally {
      if (mounted) {
        setState(() {
          _isSaving = false;
        });
      }
    }
  }

  void _skip() {
    Navigator.pop(context, widget.initialInterests);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Interests'),
      ),
      body: FutureBuilder<List<String>>(
        future: _availableInterestsFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(
              child: CircularProgressIndicator(),
            );
          }

          final interests = snapshot.data ?? [];

          if (interests.isEmpty) {
            return const Center(
              child: Text('No interests available'),
            );
          }

          return Column(
            children: [
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.all(20),
                  children: [
                    Text(
                      'Choose your interests',
                      style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Campus Pulse uses these to recommend events around you.',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                    const SizedBox(height: 24),
                    Wrap(
                      spacing: 10,
                      runSpacing: 10,
                      children: interests.map((interest) {
                        final normalized = interest.toLowerCase();
                        final selected =
                            _selectedInterests.contains(normalized);

                        return FilterChip(
                          label: Text(_titleCase(interest)),
                          selected: selected,
                          onSelected: (_) => _toggleInterest(interest),
                        );
                      }).toList(),
                    ),
                  ],
                ),
              ),
              SafeArea(
                top: false,
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: _isSaving ? null : _skip,
                          child: const Text('Skip'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: FilledButton(
                          onPressed: _isSaving ? null : _saveInterests,
                          child: Text(_isSaving ? 'Saving...' : 'Save'),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}