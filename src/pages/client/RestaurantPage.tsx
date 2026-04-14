import React from "react";
import { useNavigate } from "react-router-dom";

const RestaurantHero = () => {
  const navigate = useNavigate();
  
  return (
    <section className="relative flex h-[500px] items-center justify-center 2xl:h-[600px]">
      <div className="absolute inset-0 z-0">
        <img
          src="https://res.cloudinary.com/diz4qbnnj/image/upload/v1768506314/hero-section_mnfyjb.png"
          alt="Restaurant Interior"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/30" />
      </div>

      <div className="container relative z-10 mx-auto px-6 text-center text-white">
        <h1 className="mb-4 text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">
          Thưởng thức ẩm thực <br />
          tinh hoa tại Cây Phượng
        </h1>
        <p className="mx-auto mb-8 max-w-3xl text-lg font-light text-gray-200">
          Trải nghiệm đỉnh cao của nghệ thuật ẩm thực, nơi hương vị truyền thống{" "}
          <br className="hidden md:block" />
          hòa quyện với sự đổi mới hiện đại trong một khung cảnh khó quên.
        </p>
        <button
          onClick={() => navigate("/restaurant/booking")}
          className="min-w-[160px] rounded-full bg-cyan-400 px-8 py-3 text-base font-bold uppercase tracking-wide text-white shadow-lg transition-transform hover:scale-105 hover:bg-cyan-500"
        >
          Đặt bàn
        </button>
      </div>
    </section>
  );
};

const FeaturedDishes = () => {
  const dishes = [
    {
      img: "https://res.cloudinary.com/diz4qbnnj/image/upload/v1768506312/pho-choc-troi_hgoc3b.png",
      name: "Phở Chọc Trời",
      desc: "Một biến tấu hiện đại của món ăn cổ điển với thịt bò wagyu mềm chậm trong nước dùng thơm ngon, đậm đà.",
    },
    {
      img: "https://res.cloudinary.com/diz4qbnnj/image/upload/v1768506312/goi-cua-hoang-de_ryixoq.png",
      name: "Gỏi Cuốn Hoàng Đế",
      desc: "Chả giò sang trọng với tôm hùm tươi, rau thơm và nước chấm chanh dây chua ngọt.",
    },
    {
      img: "https://res.cloudinary.com/diz4qbnnj/image/upload/v1768506310/ambiance-5_fg8aio.png",
      name: "Cá Tầm Sapa Nướng",
      desc: "Cá tầm Sapa có nguồn gốc địa phương, nướng hoàn hảo với các loại gia vị và thảo mộc trên núi.",
    },
  ];

  return (
    <section className="bg-white py-20">
      <div className="mx-auto w-full max-w-screen-2xl px-6 lg:px-12">
        <div className="mb-16 text-center">
          <h2 className="mb-3 text-3xl font-bold text-gray-800">
            Món ăn làm nên tên tuổi
          </h2>
          <p className="mx-auto max-w-2xl text-gray-500">
            Nền tảng ẩm thực của chúng tôi được chế tác bằng niềm đam mê và
            những nguyên liệu tốt nhất.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {dishes.map((dish, index) => (
            <div
              key={index}
              className="group flex flex-col items-center text-center"
            >
              <div className="mb-6 aspect-square w-full overflow-hidden rounded-2xl shadow-lg">
                <img
                  src={dish.img}
                  alt={dish.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <h3 className="mb-2 text-xl font-bold text-gray-800">
                {dish.name}
              </h3>
              <p className="px-4 text-sm leading-relaxed text-gray-500">
                {dish.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Ambiance = () => {
  return (
    <section className="bg-stone-50 py-20">
      <div className="mx-auto w-full max-w-screen-2xl px-6 lg:px-12">
        <div className="mb-12 text-center">
          <h2 className="mb-3 text-3xl font-bold text-gray-800">
            Không gian & Trải nghiệm
          </h2>
          <p className="text-gray-500">
            Không gian ấm cúng, đồng điệu cùng hương vị tuyệt vời.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="group relative h-[400px] w-full overflow-hidden rounded-2xl shadow-md lg:h-auto">
            <img
              src="https://res.cloudinary.com/diz4qbnnj/image/upload/v1768506312/ambiance-1_xbkljn.png"
              alt="Main Interior"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="group relative aspect-square overflow-hidden rounded-2xl shadow-sm">
              <img
                src="https://res.cloudinary.com/diz4qbnnj/image/upload/v1768506311/ambiance-2_rfd1zf.png"
                alt="Corner"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </div>

            <div className="group relative aspect-square overflow-hidden rounded-2xl shadow-sm">
              <img
                src="https://res.cloudinary.com/diz4qbnnj/image/upload/v1768506311/ambiance-3_cwmg6m.png"
                alt="Detail"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </div>

            <div className="group relative aspect-square overflow-hidden rounded-2xl shadow-sm">
              <img
                src="https://res.cloudinary.com/diz4qbnnj/image/upload/v1768506311/ambiance-4_eqvbsh.png"
                alt="Outdoor"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </div>

            <div className="group relative aspect-square overflow-hidden rounded-2xl shadow-sm">
              <img
                src="https://res.cloudinary.com/diz4qbnnj/image/upload/v1768506310/ambiance-5_fg8aio.png"
                alt="Lighting"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const RestaurantPage = () => {
  return (
    <div className="min-h-screen bg-white font-sans text-gray-800">
      <RestaurantHero />
      <FeaturedDishes />
      <Ambiance />
    </div>
  );
};

export default RestaurantPage;
