import { useState } from "react";
import { usePostStore } from "../store/usePostStore";
import { useAuthStore } from "../store/useAuthStore";
import { ImagePlus, Loader2, X } from "lucide-react";

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

    console.log('Submitting post with image:', image ? 'Yes' : 'No');
    await createPost(formData);
    setContent("");
    setImage(null);
    setImagePreview("");
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