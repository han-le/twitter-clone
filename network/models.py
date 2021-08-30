from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    pass


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    bio = models.TextField(blank=True, null=True, max_length=280)
    avatar = models.URLField(blank=True, null=True)

    # return all Profiles that this Profile is following
    all_following = models.ManyToManyField(
        'self',
        symmetrical=False,
        through='Follow',
        related_name='all_followers'
    )


class Follow(models.Model):
    from_user = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='following')
    to_user = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='followers')


class Post(models.Model):
    author = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='created_posts')
    content = models.TextField(max_length=280)
    created_on = models.DateTimeField(auto_now_add=True)
    modified_on = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    # Return all Profile that likes this post
    likes = models.ManyToManyField(Profile, through='Like')

    class Meta:
        ordering = ['-created_on']

    def serialize(self):
        return {
            'author': self.author.user.username,
            'content': self.content,
            'timestamp': self.created_on.strftime("%b %d %Y, %I:%M %p"),
            'like_count': self.likes.all().count()
        }

    def __str__(self):
        return self.content


class Like(models.Model):
    owner = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='likes')
    on_post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='post_likes')
