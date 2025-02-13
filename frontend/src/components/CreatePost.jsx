import { useState } from "react";
import { usePostStore } from "../store/usePostStore";
import { useAuthStore } from "../store/useAuthStore";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "react-hot-toast";

const CreatePost = () => {
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const { createPost, isLoading } = usePostStore();
  const { authUser } = useAuthStore();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    const formData = new FormData();
    formData.append("content", content);
    if (image) {
      console.log('Image being added to FormData:', image);
      formData.append("image", image);
    }

    try {
      console.log('Submitting post with image:', image ? 'Yes' : 'No');
      const response = await createPost(formData);
      console.log('Post creation response:', response);
      
      // Verify the image URL in the created post
      if (image && (!response?.image || response.image === '')) {
        console.error('Image URL missing in created post:', response);
        toast.error('Image upload failed. Please try again.');
        return;
      }
      
      setContent("");
      setImage(null);
      setImagePreview("");
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error(error.response?.data?.message || 'Error creating post');
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview("");
  };

  return (
    <div className="bg-base-100 rounded-lg p-4 mb-4">
      <div className="flex gap-3">
        <img
          src={authUser?.profilePic || "/avatar.png"}
          alt="user avatar"
          className="w-10 h-10 rounded-full object-cover"
        />
        <form className="flex-1" onSubmit={handleSubmit}>
          <textarea
            className="textarea textarea-bordered w-full mb-2"
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          {imagePreview && (
            <div className="relative mb-2">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full max-h-60 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 p-1 bg-base-100 rounded-full hover:bg-base-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          <div className="flex justify-between items-center">
            <label className="btn btn-ghost btn-sm">
              <ImagePlus className="w-5 h-5" />
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleImageChange}
              />
            </label>
            <button
              className="btn btn-primary"
              type="submit"
              disabled={!content.trim() || isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Post"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePost; 