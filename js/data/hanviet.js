// Âm Hán Việt của các chữ trong từ vựng và các thành phần cấu tạo thường gặp
const HANVIET = Object.fromEntries(`
爱ái 八bát 爸bá 杯bôi 子tử 北bắc 京kinh 本bản 不bất 菜thái 茶trà 吃ngật 出xuất 租tô 车xa 打đả 电điện 话thoại 大đại 的đích
点điểm 脑não 视thị 影ảnh 东đông 西tây 都đô 读độc 对đối 起khởi 多đa 少thiểu 儿nhi 二nhị 饭phạn 店điếm 飞phi 机cơ 分phân 钟chung
高cao 兴hưng 个cá 工công 作tác 狗cẩu 汉hán 语ngữ 好hảo 喝hát 和hòa 很khẩn 后hậu 面diện 回hồi 会hội 火hỏa 站trạm 几kỷ 家gia
叫khiếu 今kim 天thiên 九cửu 开khai 看khán 见kiến 块khối 来lai 老lão 师sư 了liễu 冷lãnh 里lý 六lục 妈ma 吗ma 买mãi 猫miêu 没một
关quan 系hệ 有hữu 米mễ 名danh 字tự 明minh 哪na 那na 呢ni 能năng 你nễ 年niên 女nữ 朋bằng 友hữu 漂phiêu 亮lượng 苹bình 果quả
七thất 前tiền 钱tiền 请thỉnh 去khứ 热nhiệt 人nhân 认nhận 识thức 三tam 商thương 上thượng 午ngọ 谁thùy 什thập 么ma 十thập 时thời 候hậu 是thị
书thư 水thủy 睡thụy 觉giác 说thuyết 四tứ 岁tuế 他tha 她tha 太thái 气khí 听thính 同đồng 学học 喂úy 我ngã 们môn 五ngũ 喜hỉ 欢hoan
下hạ 雨vũ 先tiên 生sinh 现hiện 在tại 想tưởng 小tiểu 姐thư 些ta 写tả 谢tạ 星tinh 期kỳ 习tập 校hiệu 一nhất 医y 院viện 衣y
服phục 椅ỷ 月nguyệt 再tái 怎chẩm 样dạng 这giá 中trung 国quốc 住trú 桌trác 昨tạc 坐tọa 做tố 吧ba 白bạch 百bách 帮bang 助trợ 报báo
纸chỉ 比tỷ 别biệt 宾tân 馆quán 长trường 唱xướng 歌ca 穿xuyên 次thứ 从tòng 错thác 篮lam 球cầu 到đáo 得đắc 等đẳng 弟đệ 第đệ 懂đổng
房phòng 间gian 非phi 常thường 务vụ 员viên 告cáo 诉tố 哥ca 给cấp 公công 共cộng 汽khí 司ty 贵quý 过quá 还hoàn 孩hài 号hiệu 黑hắc
红hồng 迎nghênh 答đáp 场trường 鸡kê 蛋đản 件kiện 教giáo 室thất 介giới 绍thiệu 进tiến 近cận 就tựu 咖ca 啡phê 始thủy 考khảo 试thí 可khả
以dĩ 课khóa 快khoái 乐lạc 累lụy 离ly 两lưỡng 零linh 路lộ 旅lữ 游du 卖mại 慢mạn 忙mang 每mỗi 妹muội 门môn 条điều 男nam 您nâm
牛ngưu 奶nãi 旁bàng 边biên 跑bào 步bộ 便tiện 宜nghi 票phiếu 妻thê 床sàng 千thiên 铅duyên 笔bút 晴tình 让nhượng 日nhật 班ban 身thân 体thể
病bệnh 事sự 情tình 手thủ 表biểu 送tống 虽tuy 然nhiên 但đãn 它tha 踢thích 足túc 题đề 跳khiêu 舞vũ 外ngoại 完hoàn 玩ngoạn 晚vãn 往vãng
为vi 问vấn 瓜qua 希hy 望vọng 洗tẩy 笑tiếu 新tân 姓tính 休hưu 息tức 雪tuyết 颜nhan 色sắc 眼nhãn 睛tình 羊dương 肉nhục 药dược 要yếu
也dã 已dĩ 经kinh 意ý 思tư 因nhân 所sở 阴âm 泳vịnh 右hữu 鱼ngư 远viễn 运vận 动động 早tảo 丈trượng 夫phu 找trảo 着trứ 真chân
正chính 知tri 道đạo 准chuẩn 备bị 走tẩu 最tối 左tả 阿a 姨di 啊a 矮ải 安an 静tĩnh 把bả 搬ban 办biện 法pháp 半bán 包bao
饱bão 方phương 被bị 鼻tỵ 较giảo 赛tái 记ký 必tất 须tu 变biến 化hóa 冰băng 箱tương 而nhi 且thả 单đơn 参tham 加gia 草thảo 层tầng
差sai 超siêu 市thị 衬sấn 衫sam 成thành 绩tích 城thành 迟trì 除trừ 船thuyền 春xuân 词từ 典điển 聪thông 扫tảo 算toán 带đới 担đảm 心tâm
糕cao 当đương 地địa 铁thiết 图đồ 梯thê 邮bưu 冬đông 物vật 短đoản 段đoạn 锻đoán 炼luyện 饿ngạ 耳nhĩ 朵đóa 发phát 烧thiêu 放phóng 复phục
附phụ 干can 净tịnh 感cảm 冒mạo 趣thú 刚cương 才tài 根căn 据cứ 跟cân 更canh 园viên 故cố 刮quát 风phong 于vu 害hại 怕phạ 板bản
护hộ 照chiếu 花hoa 画họa 坏hoại 环hoàn 境cảnh 换hoán 黄hoàng 议nghị 或hoặc 者giả 乎hồ 极cực 季quý 节tiết 检kiểm 查tra 简giản 健kiện
康khang 讲giảng 脚cước 接tiếp 街nhai 结kết 婚hôn 束thúc 目mục 解giải 决quyết 借tá 理lý 久cửu 旧cựu 句cú 定định 渴khát 刻khắc 客khách
空không 调điều 口khẩu 哭khốc 裤khố 筷khoái 蓝lam 礼lễ 历lịch 史sử 脸kiểm 练luyện 辆lượng 邻lân 居cư 楼lâu 绿lục 马mã 满mãn 帽mạo
拿nã 南nam 难nan 级cấp 轻khinh 鸟điểu 努nỗ 力lực 爬ba 山sơn 盘bàn 胖bàn 啤ti 酒tửu 葡bồ 萄đào 普phổ 通thông 骑kỵ 奇kỳ
怪quái 清thanh 楚sở 秋thu 裙quần 容dung 易dị 如như 伞tản 网võng 声thanh 音âm 世thế 界giới 瘦sấu 叔thúc 舒thư 树thụ 数số 刷xoát
牙nha 平bình 阳dương 特đặc 疼đông 提đề 育dục 甜điềm 头đầu 突đột 腿thối 碗oản 万vạn 忘vong 位vị 文văn 惯quán 澡táo 夏hạ 相tương
信tín 香hương 蕉tiêu 像tượng 闻văn 鲜tiên 行hành 李lý 熊hùng 需nhu 选tuyển 择trạch 求cầu 爷gia 般ban 银ngân 饮ẩm 料liệu 应ưng 该cai
响hưởng 用dụng 戏hí 又hựu 遇ngộ 元nguyên 愿nguyện 越việt 张trương 急cấp 顾cố 片phiến 只chỉ 终chung 种chủng 重trọng 周chu 末mạt 主chủ 注chú
自tự 己kỷ 总tổng 嘴chủy 业nghiệp
父phụ 巴ba 木mộc 匕chủy 采thải 乞khất 丁đinh 曰viết 舌thiệt 勺chước 占chiêm 凶hung 景cảnh 兀ngột 寸thốn 夕tịch 反phản 广nghiễm 刀đao 吾ngô
曷hạt 艮cấn 云vân 立lập 乙ất 豕thỉ 土thổ 夬quái 未vị 令lệnh 田điền 苗miêu 殳thù 糸mịch 尼ni 厶khư 尔nhĩ 戋tiên 青thanh 执chấp
隹chuy 矦hầu 疋sơ 垂thùy 兑đoài 斤cân 凡phàm 畏úy 戈qua 壴trú 欠khiếm 卜bốc 王vương 此thử 与dữ 射xạ 其kỳ 交giao 矢thỉ 冉nhiễm
玉ngọc 卓trác 邦bang 巾cân 氏thị 另lánh 兵binh 官quan 昌xương 穴huyệt 昔tích 监giám 至chí 旦đán 寺tự 弓cung 董đổng 户hộ 尚thượng 贝bối
斥xích 合hợp 亥hợi 卬ngang 勿vật 虫trùng 孝hiếu 召triệu 井tỉnh 尤vưu 台đài 式thức 各các 曼mạn 亡vong 母mẫu 乃nãi 止chỉ 示thị 毛mao
丙bính 页hiệt 兆triệu 無vô 舛suyễn 免miễn 布bố 夭yêu 亲thân 彦ngạn 约ước 永vĩnh 直trực 首thủ 取thủ 夷di 委ủy 争tranh 巳tỵ 皮bì
亦diệc 尸thi 责trách 尺xích 余dư 舟chu 曲khúc 具cụ 羔cao 失thất 由do 豆đậu 柬giản 尧nghiêu 付phó 咸hàm 冈cương 古cổ 丰phong 昭chiêu
竟cánh 奂hoán 义nghĩa 及cập 佥thiêm 建kiến 隶lệ 却khước 妾thiếp 圭khuê 吉cát 昏hôn 角giác 犬khuyển 库khố 厂hán 娄lâu 录lục 奴nô 爪trảo
皿mãnh 卑ti 酉dậu 匋đào 並tịnh 甬dũng 圣thánh 林lâm 君quân 谷cốc 士sĩ 廿nhập 叟tẩu 舍xá 予dư 甘cam 退thoái 石thạch 宛uyển 贯quán
喿táo 言ngôn 焦tiêu 象tượng 斗đẩu 向hướng 禺ngu 原nguyên 戉việt 刍sô 厄ách 觜chủy 乍sạ 斿du 禸nhựu 卅tạp 匍bồ 帀táp 丂khảo 攵phộc
`.trim().split(/\s+/).map((s) => [[...s][0], s.slice([...s][0].length)]));
