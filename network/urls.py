from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),  # Show all posts, show posts from following account
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path('test', views.test),

    # API Routes
    path('posts/<str:post_type>', views.load_posts, name='load_posts'),  # Load all posts
    path('post', views.new_post, name='new_post'),  # Create a post
    path('post/<int:post_id>', views.post, name='post'),  # Get or edit a post
    path('profile/<str:username>', views.profile, name='profile'),  # Profile page
    path('like/<int:post_id>', views.like, name='like'),  # Like a post based on id
    path('follow', views.follow, name='follow'),  # Follow a user
]
