import { useState, useEffect } from "react";
import { usePostStore } from "../store/usePostStore";
import { useAuthStore } from "../store/useAuthStore";
import { Heart, MessageCircle, Send, Trash2, MoreVertical, Edit2, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "react-hot-toast";

const Post = ({ post }) => {
  const [comment, setComment] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content);
  const { likeUnlikePost, addComment, deletePost, updatePost } = usePostStore();
  const { authUser, socket } = useAuthStore();

  const isLiked = post.likes.includes(authUser?._id);
  const isOwnPost = post.user._id === authUser?._id;

  const handleLike = async () => {
    await likeUnlikePost(post._id);
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    await addComment(post._id, comment);
    setComment("");
  };

  const handleDelete = () => {
    toast((t) => (
      <div className="flex items-center gap-4">
        <div>
          <p className="font-medium mb-1">Delete Post?</p>
          <p className="text-sm text-gray-500">This action cannot be undone.</p>
        </div>
        <div className="flex gap-2">
          <button
            className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
            onClick={() => {
              deletePost(post._id);
              toast.dismiss(t.id);
              setShowOptions(false);
            }}
          >
            Delete
          </button>
          <button
            className="px-3 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors text-sm"
            onClick={() => toast.dismiss(t.id)}
          >
            Cancel
          </button>
        </div>
      </div>
    ), {
      duration: 5000,
      position: "top-center",
      style: {
        background: "white",
        padding: "1rem",
        borderRadius: "0.5rem",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      },
    });
  };

  const handleEdit = () => {
    setIsEditing(true);
    setShowOptions(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedContent(post.content);
  };

  const handleSaveEdit = async () => {
    if (!editedContent.trim()) return;
    const formData = new FormData();
    formData.append("content", editedContent);
    await updatePost(post._id, formData);
    setIsEditing(false);
  };

  return (
    <div className="bg-base-100 rounded-lg p-4 mb-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Post Header */}
      <div className="flex items-center gap-3 mb-4">
        <img
          src={post.user.profilePic || "/avatar.png"}
          alt={post.user.username}
          className="w-10 h-10 rounded-full object-cover border-2 border-base-200"
        />
        <div className="flex-1">
          <h2 className="font-semibold hover:underline cursor-pointer">
            {post.user.fullName}
          </h2>
          <p className="text-sm text-gray-500">
            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
          </p>
        </div>
        {isOwnPost && (
          <div className="relative">
            <button
              className="btn btn-ghost btn-sm btn-circle"
              onClick={() => setShowOptions(!showOptions)}
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            {showOptions && (
              <div className="absolute right-0 mt-2 w-48 bg-base-100 rounded-lg shadow-lg z-10">
                <button
                  className="w-full px-4 py-2 text-left hover:bg-base-200 rounded-lg flex items-center gap-2"
                  onClick={handleEdit}
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Post
                </button>
                <button
                  className="w-full px-4 py-2 text-left text-red-500 hover:bg-base-200 rounded-lg flex items-center gap-2"
                  onClick={handleDelete}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Post
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Post Content */}
      {isEditing ? (
        <div className="mb-4">
          <textarea
            className="textarea textarea-bordered w-full"
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              className="btn btn-ghost btn-sm"
              onClick={handleCancelEdit}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleSaveEdit}
              disabled={!editedContent.trim()}
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <p className="mb-4 text-lg">{post.content}</p>
      )}

      {post.image && (
        <div className="mb-4 rounded-lg overflow-hidden">
          <img
            src={post.image}
            alt="post"
            className="w-full rounded-lg hover:scale-[1.02] transition-transform cursor-pointer"
          />
        </div>
      )}

      {/* Post Actions */}
      <div className="flex items-center gap-6 mb-4 border-t border-b py-2">
        <button
          className={`flex items-center gap-2 hover:bg-base-200 p-2 rounded-lg transition-colors ${
            isLiked ? "text-red-500" : ""
          }`}
          onClick={handleLike}
        >
          <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
          <span>{post.likes.length} Likes</span>
        </button>
        <button
          className="flex items-center gap-2 hover:bg-base-200 p-2 rounded-lg transition-colors"
          onClick={() => setShowComments(!showComments)}
        >
          <MessageCircle className="w-5 h-5" />
          <span>{post.comments.length} Comments</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t pt-4">
          {/* Comment Form */}
          <form onSubmit={handleComment} className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Write a comment..."
              className="input input-bordered flex-1"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={!comment.trim()}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Comments List */}
          <div className="space-y-4">
            {post.comments.map((comment, idx) => (
              <div key={idx} className="flex items-start gap-2 group">
                <img
                  src={comment.user.profilePic || "/avatar.png"}
                  alt={comment.user.username}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div className="flex-1 bg-base-200 p-2 rounded-lg">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold hover:underline cursor-pointer">
                      {comment.user.fullName}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(comment.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <p className="text-sm">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Post; 