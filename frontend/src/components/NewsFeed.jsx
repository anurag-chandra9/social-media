import { useEffect } from "react";
import { usePostStore } from "../store/usePostStore";
import CreatePost from "./CreatePost";
import Post from "./Post";
import { Loader2 } from "lucide-react";

const NewsFeed = () => {
  const { posts, isLoading, getFeedPosts } = usePostStore();

  useEffect(() => {
    getFeedPosts();
  }, [getFeedPosts]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-16rem)]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-4 px-4">
      <CreatePost />
      
      {posts.length === 0 ? (
        <div className="text-center py-8">
          <div className="bg-base-200 rounded-lg p-8">
            <h3 className="text-xl font-semibold mb-2">No Posts Yet</h3>
            <p className="text-gray-500 mb-4">
              Be the first one to share something with the community!
            </p>
            <button 
              className="btn btn-primary"
              onClick={() => document.querySelector('textarea').focus()}
            >
              Create Your First Post
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Post key={post._id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
};

export default NewsFeed; 