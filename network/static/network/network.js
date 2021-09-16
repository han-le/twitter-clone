// When the index page is loaded => show all Posts
document.addEventListener('DOMContentLoaded', function () {
    console.log('Load index page...');
    loadAllPosts('all'); // Load all the posts by default
    highlightCurrentNav('nav-all-posts');
    let profileView = document.getElementById('profile-view');
    let composeView = document.getElementById('compose-view');
    profileView.style.display = 'none';

    // Add events for LEFT navbar to toggle between all posts and following posts
    document.getElementById('nav-all-posts').onclick = function () {
        highlightCurrentNav('nav-all-posts');
        profileView.style.display = 'none';
        loadAllPosts('all');
    }
    document.getElementById('nav-following-posts').onclick = function () {
        highlightCurrentNav('nav-following-posts');
        profileView.style.display = 'none';
        loadAllPosts('following')
    }
    document.getElementById('nav-profile').onclick = function () {
        highlightCurrentNav('nav-profile');
        profileView.style.display = 'block';
        composeView.style.display = 'none';
        loadProfile('tomnook', profileView)
        loadAllPosts('me')
    }
    // let postForm = document.getElementById('content');
    // if (postForm !== null) {
    //     postForm.addEventListener('keyup', toggleSubmit)
    // }

})


const toggleSubmit = () => {
    document.getElementById('submit-post').disabled = document.getElementById('content').value.length <= 0;
}

const submitPost = () => {
    const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    const request = new Request(
        '/post',
        {headers: {'X-CSRFToken': csrftoken}}
    );

    // Get the value of the form input + Get the current id (author)
    let content = document.getElementById('content').value;
    let author_id = document.getElementById('author').value;

    fetch(request, {
        method: 'POST',
        mode: 'same-origin',
        body: JSON.stringify({
            content: content,
            author_id: author_id
        })
    })
        .then(r => r.json())
        .then(function () {
            console.log('Post is created!');
        })
}

// Let user like or unlike a post
const like = (post_id, likeDiv) => {

    const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    let url = 'like/' + post_id;
    const request = new Request(
        url,
        {headers: {'X-CSRFToken': csrftoken}}
    );

    fetch(request, {
        method: 'POST',
        mode: 'same-origin',
    })
        .then(response => response.json())
        .then(result => {
            console.log(result);
            renderLikeBtn(post_id, likeDiv, result.message)
        });
}

// Re-render like button
const renderLikeBtn = (post_id, likeDiv, action) => {
    let url = 'like/' + post_id;
    fetch(url)
        .then(response => response.json())
        .then(data => {
            // Update the new like count
            likeDiv.querySelector('.like-count').innerHTML = data.likes;
            // Change the color of the heart
            if (action === 'like') {
                likeDiv.querySelector('.action-icon').innerHTML = `<i class="fas fa-heart red"></i>`
            } else {
                likeDiv.querySelector('.action-icon').innerHTML = `<i class="far fa-heart"></i>`
            }
        })
}

const getPost = (post_id) => {
    fetch('post/' + post_id)
        .then(r => r.json())
        .then(data => {
            renderPost(data)
        })
}

// For logged in user only
const renderPost = (post) => {

    // Change the heart color based on the user liked it or not
    let likeButton;
    if (post.liked === true) {
        likeButton = `<div class="action-icon"><i class="fas fa-heart red"></i></div>`;
    } else {
        likeButton = `<div class="action-icon"><i class="far fa-heart"></i></div>`
    }

    //Edit button
    let editDiv = '';
    if (post.editable === true) {
        editDiv = `<div class="action-button">
                        <div class="action-icon" style="color: #dadee1">
                            <i class="fas fa-pen"></i>
                        </div>
                   </div>`
    }


    return `<div class="global-card post">
                <div class="post-card-header d-flex">
                    <div class="avatar">
                        <a href="#"><img src="${post.avatar}" width="50" height="50"></a>
                    </div>
                    <div class="post-info">
                        <div>
                            <div class="username">${post.author}</div>
                            <div class="post-date">${post.timestamp}</div>
                        </div>
                    </div>
                </div>
                <div class="post-card-body">
                    <div class="post-content-view">${post.content}</div>
                    <div class="post-edit-view">
<!--                            <form>-->
<!--                                <div class="post-box" style="font-size: 17px">-->
<!--                                    <textarea id="" placeholder="test"></textarea>-->
<!--                                </div>-->
<!--                                <div class="form-footer">-->
<!--                                    <div style="text-align: right; padding-top: 10px">-->
<!--                                        <input type="submit" value="Save">-->
<!--                                    </div>-->
<!--                                </div>-->
<!--                            </form>-->
                    </div>
                </div>
                <div class="post-card-footer theme">
                    ${editDiv}
                    <div class="action-button">
                        <div class="action-icon">
                            <i class="far fa-paper-plane"></i>
                        </div>
                    </div>
                    <div class="action-button">
                        <div class="action-icon">
                            <i class="far fa-comment-alt"></i>
                        </div>
                    </div>
                    <div class="action-button likeBtn">
                        ${likeButton}
                        <div class="like-count">${post.like_count}</div>
                    </div>
                </div>
            </div>`;
}

const editPost = (post_id) => {
    console.log('Edit post: ', post_id);

    // Show edit form + Hide content section
    let editDiv = document.getElementById('edit-section-' + post_id);
    let contentDiv = document.getElementById('content-' + post_id);
    let originalContent = contentDiv.innerHTML;
    let editForm = document.getElementById('edit-form-' + post_id);
    let editTextarea = editForm.elements[0];

    editTextarea.value = originalContent;
    editDiv.style.display = 'block';
    contentDiv.style.display = 'none';

    // Attach submit event for edit form
    editForm.onsubmit = function () {
        // Validate data:
        let updatedContent = editTextarea.value;
        // 1 - Trim all white spaces
        updatedContent = updatedContent.trim();
        // 2 - Content can not be empty and must be different than original
        if (updatedContent !== '' && updatedContent !== originalContent) {
            submitEditPost(post_id, updatedContent, editDiv, contentDiv)
        }
        return false;
    }
}

const submitEditPost = (post_id, updatedContent, editView, contentView) => {

    const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    const request = new Request(
        '/post/' + post_id,
        {headers: {'X-CSRFToken': csrftoken}}
    );

    fetch(request, {
        method: 'PUT',
        mode: 'same-origin',
        body: JSON.stringify({
            post_id: post_id,
            content: updatedContent,
        })
    })
        .then(function (response) {
            if (response.status === 403) {
                console.log('You can not edit someone else post');
                return;
            }
            response.json()
                .then(function (message) {
                    console.log(message);
                    // Update the content of the post on view
                    contentView.innerHTML = updatedContent;
                    contentView.style.display = 'block';  // Show the post content again
                    editView.style.display = 'none';  // Hide the edit form
                })
        })
}

const loadAllPosts = (post_type) => {
    // Call API to get all Post
    fetch('/posts/' + post_type)
        .then(r => r.json())
        .then((data) => {

            data.forEach((post) => {
                let postContainer = document.createElement('div');  // Create a div to contain the post
                postContainer.innerHTML = renderPost(post);  // Append the html to the div
                // Event like
                const likeBtn = postContainer.querySelector('.likeBtn');
                likeBtn.addEventListener('click', () => {
                    like(post.id, likeBtn);
                });
                document.getElementById('all-post-view').append(postContainer);  // Append post container to the view
            })
        })
    console.log('Function loadAllPost was called')
}

const highlightCurrentNav = (selectedNav) => {
    let navItems = ['nav-all-posts', 'nav-following-posts', 'nav-profile'];
    document.getElementById(selectedNav).classList.add('highlight');
    navItems.forEach((navItem) => {
        if (navItem !== selectedNav) {
            document.getElementById(navItem).className = 'navigate-menu-item';
        }
    })
    console.log('Function highlightCurrentNav was called')
}

const loadProfile = (username, view) => {
    let followable = 'notAllowed'
    fetch('profile/' + username)
        .then(response => response.json())
        .then((data) => {
            view.innerHTML = renderProfile(data, followable)
        })
    console.log('Function loadProfile was called. Username: ', username)
}

const renderProfile = (profile, followable) => {
    let coverImage = getRandomCoverURL();

    let followBtn = '';
    if (followable === 'follow') {
        followBtn = `<button class="button-style mt-4" style="background: #7c83fd">Follow</button>`;
    } else if (followable === 'unfollow') {
        followBtn = `<button class="button-style mt-4" style="background: #7c83fd">Follow</button>`;
    }

    return `<div class="profile-header">
                <div class="profile-cover"><img src=${coverImage} width="100%" height="100%" alt="img"></div>
                <div class="profile-info">
                    <div class="profile-info--top">
                        <div class="profile-picture">
                            <div class="img-wrap">
                                <img src="${profile.avatar}" alt="img">
                            </div>
                        </div>
                        <div class="profile-follow-action">${followBtn}</div>
                    </div>
                    <div class="profile-info--middle">
                        <div class="profile-username">${profile.username}</div>
                        <div>${profile.bio}</div>
                        <div class="d-flex mt-1" style="color: #798690">
                            <div class="me-3"><i class="fas fa-map-pin me-2"></i>Saigon</div>
                            <div><i class="fas fa-link me-2"></i><a href="#">learnlingo.co</a></div>
                        </div>
                    </div>
                    <div class="profile-info--bottom">
                        <div class="me-3"><span class="me-1">${profile.followers}</span>followers</div>
                        <div><span class="me-1">${profile.following}</span>following</div>
                    </div>
                </div>
            </div>`
}

const getRandomCoverURL = () => {
    let coverImages = [
        "https://images.unsplash.com/photo-1526566762798-8fac9c07aa98?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=993&q=80",
        "https://images.unsplash.com/photo-1534964652860-3dc4dd30bb29?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1607684442857-515a6017aaac?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1568666549854-9907ec9dca70?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=700&q=80",
        "https://images.unsplash.com/photo-1518331647614-7a1f04cd34cf?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
    ]
    const randomIndex = Math.floor(Math.random() * coverImages.length);
    return coverImages[randomIndex]
}

const test = () => {
    let x;
    [1,2,3,4,5].forEach((post) => {

        x = document.createElement('h1');
        x.innerHTML = `${post}`;
        x.addEventListener('click', () => {
            console.log(x);
        });

        document.getElementById('all-post-view').append(x);  // Append post container to the view
    })

}