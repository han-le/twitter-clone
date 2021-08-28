document.addEventListener('DOMContentLoaded', function () {
    console.log('Profile page is loaded, id is: ', current_profile_id);
    // Return null if not found
    let followBtn = document.getElementById('follow-btn');
    // Add event to handle follow
    if (followBtn !== null) {
        followBtn.addEventListener('click', function () {
            // Follow or unfollow?
            if (followBtn.innerHTML === 'Follow') {
                handleFollow(current_profile_id, 'not_followed')
            } else if (followBtn.innerHTML === 'Unfollow') {
                handleFollow(current_profile_id, 'followed')
            }
        })
    }

})

const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;

const handleFollow = (profile_id_to_follow, follow_status) => {

    const request = new Request(
        '/follow',
        {headers: {'X-CSRFToken': csrftoken}}
    );
    fetch(request, {
        method: 'POST',
        mode: 'same-origin',
        body: JSON.stringify({
            follow_to_profile_id: profile_id_to_follow,
            follow_status: follow_status
        })
    }).then(r => r.json())
        .then(function () {
            let followBtn = '';
            if (follow_status === 'followed') {
                followBtn = `<button id="follow-btn" class="btn btn-warning">Follow</button>`;
                console.log('Unfollow successfully');
            } else if (follow_status === 'unfollowed') {
                followBtn = `<button id="follow-btn" class="btn btn-secondary">Unfollow</button>`;
                console.log('Follow successfully');
            }
            // Replace with a new btn
            document.getElementById('follow-btn-wrap').innerHTML = followBtn;
        })
}
