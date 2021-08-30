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

    console.log(content, author_id)

    fetch(request, {
        method: 'POST',
        mode: 'same-origin',
        body: JSON.stringify({
            content: content,
            author_id: author_id
        })
    }).then(r => r.json()).then(function () {
        console.log('Post is created!');
    })

}

// Let user like or unlike a post
const like = (post_id) => {

    const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    let url = 'like/' + post_id;
    console.log(url)
    const request = new Request(
        url,
        {headers: {'X-CSRFToken': csrftoken}}
    );
    console.log('Like this post: ', post_id);
    fetch(request, {
        method: 'POST',
        mode: 'same-origin',
    }).then(function (response) {
        response.json().then(result => {
            console.log(result)})
    }).then(() => {
        // Reload the component
        getLike(post_id)
        console.log('Function like running 3')
    })
}

// Get how many likes a post has
const getLike = (post_id) => {
    let url = 'like/' + post_id;
    console.log(url)
    fetch(url)
        .then(response => response.json())
        .then(data => {
            let likeCountDivId = 'like-' + post_id;
            document.getElementById(likeCountDivId).innerHTML = data.likes;
        })
}