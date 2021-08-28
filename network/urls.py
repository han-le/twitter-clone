
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),  # Show all posts, show posts from following account
    path('following', views.following_posts, name='following_posts'),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path('profile/<str:username>', views.profile, name='profile'),  # Profile page

    # API Routes
    path('follow', views.follow, name='follow'),
    path('post', views.post, name='post'),
    path('like/<int:post_id>', views.like, name='like')
]
