class AppUser {
  final String id;
  final String username;
  final String role;
  final String? avatar;
  final List<String> interests;

  const AppUser({
    required this.id,
    required this.username,
    required this.role,
    this.avatar,
    this.interests = const [],
  });

  factory AppUser.fromJson(Map<String, dynamic> json) {
    return AppUser(
      id: json['id']?.toString() ?? '',
      username: json['username']?.toString() ?? 'unknown',
      role: json['role']?.toString() ?? 'user',
      avatar: json['avatar']?.toString(),
      interests: json['interests'] is List
          ? List<String>.from(json['interests'].map((item) => item.toString()))
          : [],
    );
  }

  AppUser copyWith({
    String? id,
    String? username,
    String? role,
    String? avatar,
    List<String>? interests,
  }) {
    return AppUser(
      id: id ?? this.id,
      username: username ?? this.username,
      role: role ?? this.role,
      avatar: avatar ?? this.avatar,
      interests: interests ?? this.interests,
    );
  }
}