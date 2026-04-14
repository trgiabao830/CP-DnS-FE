import React from "react";
import { Clock, Zap, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative flex h-[600px] items-center justify-center">
      <div className="absolute inset-0 z-0">
        <img
          src="https://res.cloudinary.com/diz4qbnnj/image/upload/v1768500098/hero-section-image_fmkysg.png"
          alt="Hero Background"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      <div className="container relative z-10 mx-auto px-6 text-center text-white">
        <h1 className="mb-4 text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">
          Hành trình ẩm thực và <br />
          kỳ nghỉ thoải mái đang chờ đón bạn
        </h1>
        <p className="mb-8 text-lg font-light text-gray-100 md:text-xl">
          Khám phá ẩm thực tinh tế và chỗ nghỉ yên tĩnh.{" "}
          <br className="hidden md:block" />
          Đặt bàn hoặc trải nghiệm homestay thật dễ dàng.
        </p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <button
            onClick={() => navigate("/restaurant/booking")}
            className="min-w-[160px] rounded-full bg-cyan-400 px-8 py-3 text-base font-bold text-white shadow-lg transition-transform hover:scale-105 hover:bg-cyan-500"
          >
            Đặt bàn
          </button>
          <button
            onClick={() => navigate("/homestay/booking")}
            className="min-w-[160px] rounded-full bg-cyan-400 px-8 py-3 text-base font-bold text-white shadow-lg transition-transform hover:scale-105 hover:bg-cyan-500"
          >
            Đặt homestay
          </button>
        </div>
      </div>
    </section>
  );
};

interface FeatureProps {
  id: string;
  imageSrc: string;
  title: string;
  description: string;
  buttonText: string;
  linkTo: string;
  isReversed?: boolean;
}

const FeatureSection: React.FC<FeatureProps> = ({
  id,
  imageSrc,
  title,
  description,
  buttonText,
  linkTo,
  isReversed,
}) => {
  const navigate = useNavigate();

  return (
    <section id={id} className="bg-stone-50 py-20 first:pt-20">
      <div className="container mx-auto px-6">
        <div
          className={`flex flex-col items-center gap-12 lg:flex-row ${isReversed ? "lg:flex-row-reverse" : ""}`}
        >
          <div className="w-full lg:w-1/2">
            <div className="group relative overflow-hidden rounded-lg shadow-xl">
              <img
                src={imageSrc}
                alt={title}
                className="h-[350px] w-full object-cover transition-transform duration-500 group-hover:scale-110 lg:h-[400px]"
              />
            </div>
          </div>

          <div className="w-full text-center lg:w-1/2 lg:text-left">
            <h2 className="mb-4 text-3xl font-bold text-gray-800">{title}</h2>
            <p className="mb-8 text-lg leading-relaxed text-gray-600">
              {description}
            </p>
            <button
              onClick={() => navigate(linkTo)}
              className="rounded-full bg-cyan-400 px-8 py-3 text-sm font-bold text-white shadow-md transition-colors hover:bg-cyan-500"
            >
              {buttonText}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

const WhyChooseUs = () => {
  const features = [
    {
      icon: <Clock size={32} className="text-gray-800" />,
      title: "Khả dụng theo thời gian thực",
      desc: "Kiểm tra tình trạng bàn và homestay trống theo thời gian thực để lên kế hoạch cho trải nghiệm hoàn hảo của bạn.",
    },
    {
      icon: <Zap size={32} className="text-gray-800" />,
      title: "Đặt chỗ liền mạch",
      desc: "Tận hưởng quy trình đặt chỗ đơn giản từ khâu lựa chọn đến xác nhận, tất cả chỉ trong một ứng dụng.",
    },
    {
      icon: <MessageSquare size={32} className="text-gray-800" />,
      title: "Hỗ trợ tức thì",
      desc: "Nhận trợ giúp ngay lập tức với chatbot tích hợp của chúng tôi cho mọi thắc mắc của bạn.",
    },
  ];

  return (
    <section className="bg-white py-20">
      <div className="container mx-auto px-6">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold text-gray-800">
            Tại sao nên chọn Cây Phượng Dine & Stay?
          </h2>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={index}
              className="rounded-xl border border-gray-100 bg-white p-8 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-4 inline-block rounded-lg p-3">
                {feature.icon}
              </div>
              <h3 className="mb-3 text-lg font-bold text-gray-800">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-gray-500">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const LandingPage = () => {
  return (
    <>
      <HeroSection />

      {/* Restaurant Section - 👇 ĐÃ CẬP NHẬT ẢNH */}
      <FeatureSection
        id="restaurant"
        imageSrc="https://res.cloudinary.com/diz4qbnnj/image/upload/v1768500098/restaurant-section-image_zrbqn3.png"
        title="Thưởng thức hương vị tinh tế"
        description="Hãy đắm mình vào cuộc phiêu lưu ẩm thực tại nhà hàng của chúng tôi. Từ ẩm thực cao cấp đến những món ăn bình dân, thực đơn của chúng tôi cung cấp đa dạng các món ăn được chế biến từ những nguyên liệu tươi ngon nhất. Đặt bàn và gọi món yêu thích trước, hoặc quyết định khi đến."
        buttonText="Đặt bàn"
        linkTo="/restaurant/booking"
      />

      {/* Homestay Section - 👇 ĐÃ CẬP NHẬT ẢNH */}
      <FeatureSection
        id="homestay"
        imageSrc="https://res.cloudinary.com/diz4qbnnj/image/upload/v1768500097/homestay-section-image_slqqnj.png"
        title="Ngôi nhà hoàn hảo khi xa nhà của bạn"
        description="Trải nghiệm sự thoải mái và yên bình tại các homestay được chúng tôi tuyển chọn kỹ lưỡng. Dù bạn đang tìm kiếm một nơi nghỉ dưỡng ấm cúng hay một nơi ở gia đình rộng rãi, chúng tôi đều có chỗ ở phù hợp với mọi nhu cầu. Hãy đặt phòng và tận hưởng một kỳ nghỉ đáng nhớ."
        buttonText="Đặt homestay"
        linkTo="/homestay/booking"
        isReversed={true}
      />

      <WhyChooseUs />
    </>
  );
};

export default LandingPage;
