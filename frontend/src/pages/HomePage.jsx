import NewsFeed from "../components/NewsFeed";

const HomePage = () => {
  return (
    <div className="h-screen bg-base-200">
      <div className="flex items-center justify-center pt-20 px-4">
        <div className="bg-base-100 rounded-lg shadow-cl w-full max-w-3xl h-[calc(100vh-8rem)]">
          <div className="h-full rounded-lg overflow-hidden">
            <div className="h-full overflow-y-auto">
              <NewsFeed />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
