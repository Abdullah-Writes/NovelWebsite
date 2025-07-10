const db = firebase.database();
const commentsContainer = document.getElementById("commentsContainer");

let currentUser = {
  username: null,
  isAdmin: false
};

function ensureUsername() {
  if (!currentUser.username) {
    const name = prompt("Enter your name:");
    const code = prompt("Enter admin code (or leave blank if normal user):");
    currentUser.username = name || "Anonymous";
    currentUser.isAdmin = (code === "Abdullahauthor@writer1"); // your secret code
  }
}

// Add comment or reply
function addComment(parentId = null) {
  ensureUsername();
  const inputId = parentId ? `replyInput-${parentId}` : "commentInput";
  const input = document.getElementById(inputId);
  const text = input.value.trim();
  if (text === "") return;

  const newCommentRef = db.ref("comments").push();
  newCommentRef.set({
    id: newCommentRef.key,
    text: text,
    username: currentUser.username,
    isAdmin: currentUser.isAdmin,
    timestamp: Date.now(),
    parentId: parentId,
    likes: {}
  });

  input.value = "";
}

// Delete comment
function deleteComment(commentId) {
  db.ref("comments/" + commentId).remove();
}

// Like / unlike
function toggleLike(commentId, liked) {
  const likePath = `comments/${commentId}/likes/${currentUser.username}`;
  if (liked) {
    db.ref(likePath).remove();
  } else {
    db.ref(likePath).set(true);
  }
}

// Show reply input
function showReplyBox(commentId) {
  const replyBox = document.getElementById(`replyBox-${commentId}`);
  if (replyBox.innerHTML.trim() !== "") return;

  replyBox.innerHTML = `
    <textarea id="replyInput-${commentId}" placeholder="Write a reply..."></textarea>
    <button onclick="addComment('${commentId}')">Post Reply</button>
  `;
}

// Render comments in real time
db.ref("comments").on("value", (snapshot) => {
  commentsContainer.innerHTML = "";
  const data = snapshot.val() || {};
  const comments = Object.values(data).sort((a, b) => a.timestamp - b.timestamp);
  renderComments(comments);
});

function renderComments(comments) {
  const parents = comments.filter(c => !c.parentId);
  const replies = comments.filter(c => c.parentId);

  parents.forEach(comment => renderComment(comment, replies));
}

function renderComment(comment, allReplies, indent = 0) {
  const isOwner = (comment.username === currentUser.username);
  const isAdmin = currentUser.isAdmin;
  const liked = comment.likes && comment.likes[currentUser.username];
  const likeCount = comment.likes ? Object.keys(comment.likes).length : 0;

  const div = document.createElement("div");
  div.className = "comment";
  div.style.marginLeft = `${indent}px`;
  div.innerHTML = `
    <p><strong>${comment.username}</strong>: ${comment.text}</p>
    <div class="actions">
      <button onclick="toggleLike('${comment.id}', ${!!liked})">
        ${liked ? "Unlike" : "Like"} (${likeCount})
      </button>
      <button onclick="showReplyBox('${comment.id}')">Reply</button>
      ${(isOwner || isAdmin) ? `<button onclick="deleteComment('${comment.id}')">Delete</button>` : ""}
    </div>
    <div class="reply-box" id="replyBox-${comment.id}"></div>
  `;

  commentsContainer.appendChild(div);

  const replies = allReplies.filter(r => r.parentId === comment.id);
  replies.forEach(reply => renderComment(reply, allReplies, indent + 20));
}

// Scroll to top button
const scrollBtn = document.getElementById("scrollTopBtn");

window.onscroll = function() {
  if (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) {
    scrollBtn.style.display = "block";
  } else {
    scrollBtn.style.display = "none";
  }
};

scrollBtn.onclick = function() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};