class CampusEvent {
  final String id;
  final String title;
  final String type;
  final String? image;
  final int datetime;
  final String location;
  final String createdBy;
  final String createdByUsername;
  final String description;
  final List<String> tags;

  final String? action;
  final String? actionLabel;
  final String? actionLink;

  final double? lat;
  final double? lng;

  CampusEvent({
    required this.id,
    required this.title,
    required this.type,
    required this.image,
    required this.datetime,
    required this.location,
    required this.createdBy,
    required this.createdByUsername,
    required this.description,
    required this.tags,
    this.action,
    this.actionLabel,
    this.actionLink,
    this.lat,
    this.lng,
  });

  factory CampusEvent.fromJson(Map<String, dynamic> json) {
    return CampusEvent(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? 'Untitled Event',
      type: json['type']?.toString() ?? 'club',
      image: json['image']?.toString(),
      datetime: int.tryParse(json['datetime']?.toString() ?? '') ?? 0,
      location: json['location']?.toString() ?? 'Unknown location',
      createdBy: json['createdBy']?.toString() ?? '',
      createdByUsername: json['createdByUsername']?.toString() ?? 'unknown',
      description: json['description']?.toString() ?? '',
      tags: json['tags'] is List
          ? List<String>.from(json['tags'].map((tag) => tag.toString()))
          : [],
      action: json['action']?.toString(),
      actionLabel: json['actionLabel']?.toString(),
      actionLink: json['actionLink']?.toString(),
      lat: double.tryParse(json['lat']?.toString() ?? ''),
      lng: double.tryParse(json['lng']?.toString() ?? ''),
    );
  }
}