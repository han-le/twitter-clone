// When the index page is loaded => show all Posts
document.addEventListener('DOMContentLoaded', function () {
    console.log('index page finished loaded');
    let postForm = document.getElementById('content');
    if (postForm !== null) {
        postForm.addEventListener('keyup', toggleSubmit)
    }
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
const like = (post_id) => {

    const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    let url = 'like/' + post_id;
    const request = new Request(
        url,
        {headers: {'X-CSRFToken': csrftoken}}
    );

    fetch(request, {
        method: 'POST',
        mode: 'same-origin',
    }).then(function (response) {
        response.json().then(result => {
            console.log(result)
        })
    }).then(() => {
        // Reload the component
        getLike(post_id)
        console.log('Function like running 3')
    })
}

// Get how many likes a post has
const getLike = (post_id) => {
    let url = 'like/' + post_id;
    fetch(url)
        .then(response => response.json())
        .then(data => {

            // Update the like count
            let likeCountDivId = 'like-' + post_id;
            document.getElementById(likeCountDivId).innerHTML = data.likes;

            // Change the color of the heart
            let hearColorDivId = 'heart-color-' + post_id;
            let heartColorDiv = document.getElementById(hearColorDivId);
            let heartColor = heartColorDiv.className;
            if (heartColor === 'gray') {
                heartColorDiv.className = 'red';
            } else if (heartColor === 'red') {
                heartColorDiv.className = 'gray';
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
    let heartColor = 'gray';
    if (post.liked === true) {
        heartColor = 'red'
    }

    //Edit button
    let editDiv = '';
    if (post.editable === true) {
        editDiv = `<button id="edit-${post.id}">Edit</button>`
    }

    let postContainerId = 'post-container-' + post.id;
    document.getElementById(postContainerId).innerHTML =
        `<div>
            <div class="card mb-3">
                <div class="card-header">
                    <a href="/profile/${post.author}">${post.author}</a>
                </div>
                <div class="card-body">
                    
                    <h5 class="card-title"> ${post.content} </h5>
                    <p class="card-text"> Posted on ${post.timestamp} </p>
                    <div class="d-flex">

                        <!-- Like button -->
                        <div style="cursor: pointer" class="submit-like" onclick="like('${post.id}')">
                            <div id="heart-color-${post.id}" class="${heartColor}">
                                <i class="fas fa-heart"></i>
                            </div>
                        </div>
                            
                        <!-- Like count -->
                        <div class="ms-2" id="like-${post.id}"> ${post.like_count}</div>
                        
                        <!-- Edit button -->
                        ${editDiv}
                    </div>
                </div>
            </div>
        </div>`
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