import json

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator, PageNotAnInteger, EmptyPage
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.urls import reverse
from django.views.decorators.csrf import csrf_protect, csrf_exempt

from .models import User, Post, Follow, Profile, Like


def index(request):
    if request.user.is_authenticated:
        return render(request, "network/index.html")
    else:
        return render(request, 'network/login.html')


@login_required()
def load_posts(request, post_type):
    current_profile = request.user.profile
    if post_type == 'all':
        all_posts = Post.objects.all()
    elif post_type == 'following':
        following_profiles = current_profile.all_following.all()  # ALL Profiles this user follows
        all_posts = Post.objects.filter(author__in=following_profiles)  # All posts created by this user
    elif post_type == 'me':
        user_being_viewed = User.objects.get(username=request.user)
        profile_being_viewed = user_being_viewed.profile
        all_posts = profile_being_viewed.created_posts.all()
    else:
        user_being_viewed = User.objects.get(username=post_type)
        profile_being_viewed = user_being_viewed.profile
        all_posts = profile_being_viewed.created_posts.all()
    return JsonResponse([item.serialize(current_profile) for item in all_posts], safe=False)


def paginate(request, posts, post_each_page):
    # Each page has 5 posts
    paginator = Paginator(posts, post_each_page)
    page = request.GET.get('page', 1)
    try:
        paginated_posts = paginator.page(page)
    except PageNotAnInteger:
        paginated_posts = paginator.page(1)
    except EmptyPage:
        paginated_posts = paginator.page(paginator.num_pages)
    return paginated_posts


def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
            # Create a profile for this user
            new_profile = Profile.objects.create(user=user)
            new_profile.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")


# API to make a follow
@csrf_protect
@login_required(login_url='login')
def follow(request):
    if request.method == 'POST':

        '''
        fetch('/follow', {
            method: 'POST',
          body: JSON.stringify({
              follow_to_profile_id: '5',
              is_follow: true
          })
        })
        '''
        # Get data from request body
        data = json.loads(request.body)

        follow_status = data.get('follow_status')
        follow_to_profile_id = data.get('follow_to_profile_id')

        follow_to_profile = Profile.objects.get(id=follow_to_profile_id)
        follow_from_profile = request.user.profile

        if follow_status == 'not_followed':
            print('************ Create a follow ************')
            # Create a follow
            new_follow = Follow(from_user=follow_from_profile, to_user=follow_to_profile)
            new_follow.save()
        elif follow_status == 'followed':
            print('Create a follow')
            # Delete a Queryset of follow
            Follow.objects.filter(from_user=follow_from_profile, to_user=follow_to_profile).delete()

    # Show error for other cases
    else:
        return JsonResponse(
            {'error': 'Invalid request'},
            status=400
        )
    return JsonResponse({"message": "Follow successfully."}, status=201)


def profile(request, username):
    target_profile = User.objects.get(username=username).profile

    follow_status = False
    if request.user.is_authenticated:
        # Check if the logged in user has followed the profile he/her is viewing yet?
        follow_relationship = Follow.objects.filter(from_user=request.user.profile).filter(to_user=target_profile)
        if len(follow_relationship) > 0:
            follow_status = True
    return JsonResponse(target_profile.serialize(follow_status))


# Create a post
@csrf_protect
@login_required(login_url='login')
def new_post(request):
    if request.method == 'POST':
        '''
        fetch('/post', {
            method: 'POST',
            body: JSON.stringify({
                content: '....',
                author_id: ...
            })
        })
        '''

        # Get data from json
        data = json.loads(request.body)
        content = data.get('content')
        author_id = data.get('author_id')

        # Validate the data
        if content == '':
            return JsonResponse({'error': 'Content must not be empty'})

        # Create a new post
        created_post = Post(content=content, author=Profile.objects.get(id=author_id))
        created_post.save()

    # Make a post must be via POST
    else:
        return JsonResponse({'error': 'Must be POST request'})

    return JsonResponse({"message": "Post successfully."}, status=201)


# API: Get or update a post, LOG IN REQUIRED
@login_required()
def post(request, post_id):
    current_profile = request.user.profile  # Get the profile logged in
    if request.method == 'GET':
        current_post = Post.objects.get(id=post_id)  # Get a specific post
        return JsonResponse(current_post.serialize(current_profile), safe=False)

    elif request.method == 'PUT':  # Update a post
        # {post_id: ..., content: ..., user: ...}
        data = json.loads(request.body)  # Get data from request body
        target_post = Post.objects.get(id=data['post_id'])  # Get the post needed to update
        # Block editing if user is not the post's author
        if current_profile != target_post.author:
            return JsonResponse({'message': 'You are not allowed to edit this post'}, status=403)

        target_post.content = data['content']  # Update the content
        target_post.save()
        return JsonResponse({"message": "Post was updated successfully"}, status=201)

    else:
        return JsonResponse({'error': 'Wrong method'})


def like(request, post_id):
    from_profile = request.user.profile

    # Get all likes of this post
    if request.method == "GET":
        all_likes = Like.objects.filter(on_post_id=post_id)
        return JsonResponse({
            'likes': all_likes.count()
        })

    # Like / unlike a post
    elif request.method == 'POST':
        if not request.user.is_authenticated:
            return JsonResponse({
                'error': 'You need to log in'
            }, status=401)

        '''
        fetch('/like/post_id', {
            method: 'POST',
            body: JSON.stringify({
                the body is empty
            })
        })
        '''

        # Check if this user has liked this post or not
        liked_this_post = Like.objects.filter(on_post_id=post_id).filter(owner_id=from_profile.id)
        if len(liked_this_post) > 0:
            # Delete the like
            liked_this_post.delete()
            return JsonResponse({'message': 'unlike'})
        else:
            # Make a new like
            on_post = Post.objects.get(id=post_id)
            new_like = Like(on_post=on_post, owner=from_profile)
            new_like.save()
            return JsonResponse({'message': 'like'})
    else:
        return JsonResponse({'error': 'Wrong method'})


def test(request):
    return render(request, 'network/test.html')


