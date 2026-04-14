import React from "react";
import { Wifi, Coffee, Car, Trees, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const HomestayHero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative flex h-[500px] items-center justify-center 2xl:h-[600px]">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://res.cloudinary.com/diz4qbnnj/image/upload/v1768508505/hero-section_ejghes.png"
          alt="Homestay Hero"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      <div className="container relative z-10 mx-auto px-6 text-center text-white">
        <h1 className="mb-4 text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">
          Trải nghiệm lưu trú ấm cúng <br />
          tại Cây Phượng Homestay
        </h1>
        <p className="mx-auto mb-8 max-w-3xl text-lg font-light text-gray-100">
          Khám phá không gian yên bình, gần gũi với thiên nhiên{" "}
          <br className="hidden md:block" />
          và tận hưởng những dịch vụ tốt nhất cho kỳ nghỉ của bạn.
        </p>
        <button
          onClick={() => navigate("/homestay/booking")}
          className="min-w-[160px] rounded-full bg-cyan-400 px-8 py-3 text-base font-bold uppercase tracking-wide text-white shadow-lg transition-transform hover:scale-105 hover:bg-cyan-500"
        >
          Đặt homestay
        </button>
      </div>
    </section>
  );
};

const RoomTypes = () => {
  const rooms = [
    {
      img: "https://res.cloudinary.com/diz4qbnnj/image/upload/v1768508503/room-class-1_bbtbag.png",
      name: "Phòng Deluxe",
      desc: "Lý tưởng cho các cặp đôi với ban công riêng nhìn ra vườn.",
      link: "#",
    },
    {
      img: "https://res.cloudinary.com/diz4qbnnj/image/upload/v1768508503/room-class-2_uhoyks.png",
      name: "Bungalow Gia Đình",
      desc: "Không gian rộng rãi cho cả gia đình với khu vực sinh hoạt chung.",
      link: "#",
    },
    {
      img: "https://res.cloudinary.com/diz4qbnnj/image/upload/v1768508502/room-class-3_qh64qc.png",
      name: "Phòng Superior",
      desc: "Tiện nghi và ấm cúng, phù hợp cho du khách một mình hoặc hai người.",
      link: "#",
    },
  ];

  return (
    <section className="bg-white py-20">
      <div className="container mx-auto px-6">
        <div className="mb-16 text-center">
          <h2 className="mb-3 text-3xl font-bold text-gray-800">
            Các loại phòng nghỉ của chúng tôi
          </h2>
          <p className="mx-auto max-w-2xl text-gray-500">
            Mỗi phòng đều được thiết kế độc đáo để mang lại sự thoải mái và tiện
            nghi tối đa, phù hợp cho dù bạn đi du lịch một mình, cặp đôi hay
            cùng gia đình.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {rooms.map((room, index) => (
            <div key={index} className="group flex flex-col">
              <div className="relative mb-6 h-[250px] w-full overflow-hidden rounded-2xl shadow-md">
                <img
                  src={room.img}
                  alt={room.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <div className="px-2">
                <h3 className="mb-2 text-xl font-bold text-gray-800">
                  {room.name}
                </h3>
                <p className="mb-4 min-h-[40px] text-sm leading-relaxed text-gray-500">
                  {room.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Amenities = () => {
  const items = [
    { icon: <Wifi size={32} />, label: "Wi-Fi miễn phí" },
    { icon: <Coffee size={32} />, label: "Bữa sáng ngon miệng" },
    { icon: <Car size={32} />, label: "Chỗ đỗ xe an toàn" },
    { icon: <Trees size={32} />, label: "Sân vườn thư giãn" },
  ];

  return (
    <section className="bg-stone-50 py-20">
      <div className="container mx-auto px-6">
        <div className="mb-16 text-center">
          <h2 className="mb-3 text-3xl font-bold text-gray-800">
            Tiện nghi & Dịch vụ
          </h2>
          <p className="text-gray-500">
            Chúng tôi cung cấp đầy đủ tiện ích để đảm bảo <br />
            quý khách có một kỳ nghỉ thoải mái và đáng nhớ.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-10 text-center md:grid-cols-4">
          {items.map((item, index) => (
            <div key={index} className="flex flex-col items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-cyan-400 text-white shadow-lg transition-transform hover:scale-110">
                {item.icon}
              </div>
              <span className="font-bold text-gray-700">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const HomestayPage = () => {
  return (
    <div className="min-h-screen bg-white font-sans text-gray-800">
      <HomestayHero />
      <RoomTypes />
      <Amenities />
    </div>
  );
};

export default HomestayPage;
