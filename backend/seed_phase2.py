import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from hotels.models import Hotel, HotelImage, Amenity
from rooms.models import Room, RoomImage

User = get_user_model()

def seed_phase2():
    print("Seeding Phase 2 Amenities, Hotels & Rooms...")

    # Fetch Owner User
    owner = User.objects.filter(role=User.ROLE_HOTEL_OWNER).first()
    if not owner:
        owner = User.objects.create_user(
            username='owner_rahul',
            email='rahul@grandpalace.com',
            password='OwnerPassword123!',
            first_name='Rahul',
            last_name='Sharma',
            role=User.ROLE_HOTEL_OWNER
        )

    # 1. Seed Amenities
    amenities_data = [
        ('Free High-Speed Wi-Fi', 'Wifi', 'Comfort'),
        ('Swimming Pool', 'Pool', 'Comfort'),
        ('Complimentary Breakfast', 'Utensils', 'Food'),
        ('Free Parking', 'Car', 'Policy'),
        ('24/7 Room Service', 'Clock', 'Comfort'),
        ('Air Conditioning', 'Wind', 'Comfort'),
        ('Fitness Center & Gym', 'Dumbbell', 'Comfort'),
        ('Airport Shuttle', 'Bus', 'Policy'),
        ('Spa & Wellness Center', 'Sparkles', 'Comfort'),
        ('In-room Mini Bar', 'Wine', 'Food'),
    ]

    amenity_objs = []
    for name, icon, cat in amenities_data:
        a, _ = Amenity.objects.get_or_create(name=name, defaults={'icon_name': icon, 'category': cat})
        amenity_objs.append(a)

    # 2. Seed Hotels
    hotels_data = [
        {
            'name': 'The Grand Royal Palace & Resort',
            'city': 'Ahmedabad',
            'state': 'Gujarat',
            'address': 'CG Road, Navrangpura, Ahmedabad',
            'star_rating': 5,
            'guest_rating': 4.8,
            'description': 'Experience heritage luxury and modern hospitality in the heart of Ahmedabad. Featuring fine-dining restaurants, outdoor infinity pool, and lavish suite rooms.',
            'images': [
                'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1000&q=80',
                'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1000&q=80',
                'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1000&q=80',
            ],
            'rooms': [
                {
                    'title': 'Deluxe King Suite',
                    'room_type': 'DELUXE',
                    'price': 3200,
                    'capacity_adults': 2,
                    'capacity_children': 1,
                    'bed_type': 'King Bed',
                    'total_rooms': 10,
                    'image': 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1000&q=80'
                },
                {
                    'title': 'Executive Pool View Room',
                    'room_type': 'EXECUTIVE',
                    'price': 4800,
                    'capacity_adults': 3,
                    'capacity_children': 1,
                    'bed_type': 'Super King Bed',
                    'total_rooms': 5,
                    'image': 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=80'
                }
            ]
        },
        {
            'name': 'Marine Horizon Bay Hotel',
            'city': 'Mumbai',
            'state': 'Maharashtra',
            'address': 'Marine Drive, Nariman Point, Mumbai',
            'star_rating': 5,
            'guest_rating': 4.7,
            'description': 'Breathtaking ocean views overlooking Marine Drive Arabian Sea. Luxury spa, rooftop lounge, and state-of-the-art business center.',
            'images': [
                'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1000&q=80',
                'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1000&q=80',
            ],
            'rooms': [
                {
                    'title': 'Ocean Vista Deluxe Room',
                    'room_type': 'DELUXE',
                    'price': 5500,
                    'capacity_adults': 2,
                    'capacity_children': 1,
                    'bed_type': 'King Bed',
                    'total_rooms': 8,
                    'image': 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1000&q=80'
                }
            ]
        },
        {
            'name': 'Goa Palms Beach Resort & Spa',
            'city': 'Goa',
            'state': 'Goa',
            'address': 'Baga Beach Road, Calangute, Goa',
            'star_rating': 4,
            'guest_rating': 4.6,
            'description': 'Beachfront tropical paradise surrounded by lush coconut palms. Direct beach access, beach club cocktails, and private villa cabanas.',
            'images': [
                'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1000&q=80',
                'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1000&q=80',
            ],
            'rooms': [
                {
                    'title': 'Beach Cottage Suite',
                    'room_type': 'SUPER_DELUXE',
                    'price': 4200,
                    'capacity_adults': 2,
                    'capacity_children': 2,
                    'bed_type': 'Queen Bed',
                    'total_rooms': 12,
                    'image': 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1000&q=80'
                }
            ]
        }
    ]

    for h_data in hotels_data:
        hotel, created = Hotel.objects.get_or_create(
            name=h_data['name'],
            defaults={
                'owner': owner,
                'city': h_data['city'],
                'state': h_data['state'],
                'address': h_data['address'],
                'star_rating': h_data['star_rating'],
                'guest_rating': h_data['guest_rating'],
                'description': h_data['description'],
                'is_approved': True
            }
        )

        hotel.amenities.set(amenity_objs[:6])

        # Seed Hotel Images
        for idx, img_url in enumerate(h_data['images']):
            HotelImage.objects.get_or_create(
                hotel=hotel,
                image_url=img_url,
                defaults={'is_primary': (idx == 0), 'caption': f'{hotel.name} View {idx+1}'}
            )

        # Seed Rooms
        for r_data in h_data['rooms']:
            room, _ = Room.objects.get_or_create(
                hotel=hotel,
                title=r_data['title'],
                defaults={
                    'room_type': r_data['room_type'],
                    'price_per_night': r_data['price'],
                    'capacity_adults': r_data['capacity_adults'],
                    'capacity_children': r_data['capacity_children'],
                    'bed_type': r_data['bed_type'],
                    'breakfast_included': True,
                    'free_cancellation': True,
                    'total_rooms': r_data['total_rooms'],
                    'description': f"Spacious {r_data['title']} with premium bed, free Wi-Fi, air conditioning, and luxury toiletries."
                }
            )
            room.amenities.set(amenity_objs[:4])

            RoomImage.objects.get_or_create(
                room=room,
                image_url=r_data['image'],
                defaults={'is_primary': True}
            )

    print("Phase 2 Seeding Completed Successfully!")

if __name__ == '__main__':
    seed_phase2()
