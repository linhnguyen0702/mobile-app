-- Xóa Database cũ nếu tồn tại
DROP DATABASE IF EXISTS coffee_shop_db;

-- Tạo Database mới
CREATE DATABASE coffee_shop_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE coffee_shop_db;

-- Bảng Users
CREATE TABLE users (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Bảng Categories
CREATE TABLE categories (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Bảng Products
CREATE TABLE products (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    full_description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image VARCHAR(255) NOT NULL,
    category_id VARCHAR(36) NOT NULL,
    rating DECIMAL(3, 1) DEFAULT 0,
    reviews_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Bảng Product Sizes
CREATE TABLE product_sizes (
    product_id VARCHAR(36) NOT NULL,
    size VARCHAR(10) NOT NULL,
    price_modifier DECIMAL(10, 2) DEFAULT 0,
    PRIMARY KEY (product_id, size),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Bảng Order Status
CREATE TABLE order_status (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT
) ENGINE=InnoDB;

-- Bảng Payment Methods
CREATE TABLE payment_methods (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB;

-- Bảng Orders
CREATE TABLE orders (
    id VARCHAR(36) PRIMARY KEY,
    user_id INT NOT NULL,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status_id VARCHAR(36) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    delivery_address TEXT NOT NULL,
    payment_method_id VARCHAR(36) NOT NULL,
    delivery_method VARCHAR(20) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (status_id) REFERENCES order_status(id),
    FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id)
) ENGINE=InnoDB;

-- Bảng Order Items
CREATE TABLE order_items (
    id VARCHAR(36) PRIMARY KEY,
    order_id VARCHAR(36) NOT NULL,
    product_id VARCHAR(36) NOT NULL,
    quantity INT NOT NULL,
    size VARCHAR(10) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB;

-- Bảng Cart Items
CREATE TABLE cart_items (
    id VARCHAR(36) PRIMARY KEY,
    user_id INT NOT NULL,
    product_id VARCHAR(36) NOT NULL,
    quantity INT NOT NULL,
    size VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB;

-- Bảng Favorites
CREATE TABLE favorites (
    id VARCHAR(36) PRIMARY KEY,
    user_id INT NOT NULL,
    product_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id),
    UNIQUE (user_id, product_id)
) ENGINE=InnoDB;

-- Bảng Reviews
CREATE TABLE reviews (
    id VARCHAR(36) PRIMARY KEY,
    user_id INT NOT NULL,
    product_id VARCHAR(36) NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB;

-- Bảng Order History
CREATE TABLE order_history (
    id VARCHAR(36) PRIMARY KEY,
    order_id VARCHAR(36) NOT NULL,
    status_id VARCHAR(36) NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (status_id) REFERENCES order_status(id)
) ENGINE=InnoDB;

-- Insert dữ liệu mẫu
INSERT INTO categories (id, name, description) VALUES
('1', 'Tất cả đồ uống', 'Tất cả các loại đồ uống có trong cửa hàng'),
('2', 'Cà phê máy', 'Các loại cà phê được pha bằng máy espresso'),
('3', 'Phin', 'Cà phê truyền thống pha bằng phin'),
('4', 'Trà sữa', 'Các loại trà sữa với nhiều hương vị khác nhau'),
('5', 'Trà trái cây', 'Các loại trà kết hợp với trái cây tươi'),
('6', 'Sữa chua', 'Các loại sữa chua tươi và sữa chua trộn');

INSERT INTO products (id, name, description, full_description, price, image, category_id, rating, reviews_count) VALUES
('1', 'Cà phê Mocha', 'Rang đậm', 'Mocha là một loại cà phê kết hợp giữa espresso và sữa tươi cùng với một chút socola.', 45300, 'coffee1.jpg', '2', 4.8, 230),
('2', 'Flat White', 'Rang nhẹ', 'Flat White là loại cà phê gồm espresso và sữa được đánh mịn.', 35300, 'coffee2.jpg', '2', 4.6, 180),
('3', 'Cappuccino', 'Rang vừa', 'Cappuccino là loại cà phê nổi tiếng của Ý.', 40500, 'coffee3.jpg', '2', 4.7, 210),
('4', 'Americano', 'Rang đậm', 'Americano là loại cà phê được pha bằng cách pha loãng espresso với nước nóng.', 32500, 'coffee4.jpg', '2', 4.5, 190),
('5', 'Espresso', 'Rang mạnh', 'Espresso là phương pháp pha cà phê đậm đà.', 29500, 'coffee5.jpg', '2', 4.4, 150);

INSERT INTO product_sizes (product_id, size, price_modifier) VALUES
('1', 'S', -5000), 
('1', 'M', 0), 
('1', 'L', 5000),
('2', 'S', -5000), 
('2', 'M', 0), 
('2', 'L', 5000);

INSERT INTO order_status (id, name, description) VALUES
('1', 'processing', 'Đơn hàng đang được xử lý'),
('2', 'pending', 'Đơn hàng đang được giao'),
('3', 'delivered', 'Đơn hàng đã được giao thành công'),
('4', 'cancelled', 'Đơn hàng đã bị hủy');

INSERT INTO payment_methods (id, name, description) VALUES
('1', 'card', 'Thanh toán bằng thẻ ghi nợ/thẻ tín dụng'),
('2', 'momo', 'Thanh toán qua ví điện tử MoMo'),
('3', 'cash', 'Thanh toán khi nhận hàng (COD)');
-- Thêm sản phẩm cà phê phin (category_id = 3)
INSERT INTO products (id, name, description, full_description, price, image, category_id, rating, reviews_count) VALUES
('6', 'Cà phê sữa đá', 'Pha phin truyền thống', 'Cà phê pha phin truyền thống Việt Nam kèm sữa đặc và đá.', 25000, 'phin_cf_sua.jpg', '3', 4.9, 320),
('7', 'Cà phê đen đá', 'Đậm đà nguyên chất', 'Cà phê đen nguyên chất pha phin, thưởng thức cùng đá.', 20000, 'phin_cf_den.jpg', '3', 4.7, 280),
('8', 'Bạc xỉu', 'Nhẹ nhàng hương vị', 'Cà phê pha phin với nhiều sữa, ít cà phê, vị nhẹ nhàng.', 28000, 'bac_xiu.jpg', '3', 4.6, 190);

-- Thêm sản phẩm trà sữa (category_id = 4)
INSERT INTO products (id, name, description, full_description, price, image, category_id, rating, reviews_count) VALUES
('9', 'Trà sữa trân châu', 'Classic flavor', 'Trà sữa truyền thống kèm trân châu đen dai mềm.', 45000, 'tra_sua_tran_chau.jpg', '4', 4.8, 410),
('10', 'Trà sữa matcha', 'Hương matcha Nhật Bản', 'Trà sữa vị matcha thơm ngon, béo ngậy.', 50000, 'tra_sua_matcha.jpg', '4', 4.5, 230),
('11', 'Trà sữa oolong', 'Vị trà thanh tao', 'Trà sữa làm từ trà oolong cao cấp, hương vị độc đáo.', 48000, 'tra_sua_oolong.jpg', '4', 4.7, 180);

-- Thêm sản phẩm trà trái cây (category_id = 5)
INSERT INTO products (id, name, description, full_description, price, image, category_id, rating, reviews_count) VALUES
('12', 'Trà đào cam sả', 'Vị đào thơm mát', 'Trà đào kết hợp với cam sả, hương vị tươi mới.', 40000, 'tra_dao_cam_sa.jpg', '5', 4.9, 350),
('13', 'Trà vải', 'Ngọt thanh hương vải', 'Trà trái cây với vị vải tươi ngon, ít ngọt.', 38000, 'tra_vai.jpg', '5', 4.6, 210),
('14', 'Trà chanh leo', 'Chua ngọt cân bằng', 'Trà chanh leo giải khát, giàu vitamin C.', 35000, 'tra_chanh_leo.jpg', '5', 4.8, 290);

-- Thêm sản phẩm sữa chua (category_id = 6)
INSERT INTO products (id, name, description, full_description, price, image, category_id, rating, reviews_count) VALUES
('15', 'Sữa chua trái cây', 'Kết hợp trái cây tươi', 'Sữa chua tự nhiên kèm mix trái cây tươi theo mùa.', 42000, 'sua_chua_trai_cay.jpg', '6', 4.7, 270),
('16', 'Sữa chua đánh đá', 'Sữa chua truyền thống', 'Sữa chua đánh cùng đá, đường và chanh dây.', 32000, 'sua_chua_danh_da.jpg', '6', 4.5, 190),
('17', 'Sữa chua matcha', 'Vị matcha độc đáo', 'Sữa chua kết hợp với bột matcha Nhật Bản.', 45000, 'sua_chua_matcha.jpg', '6', 4.6, 160);

-- Thêm các size cho sản phẩm mới
INSERT INTO product_sizes (product_id, size, price_modifier) VALUES
-- Cà phê phin
('6', 'S', -3000), ('6', 'M', 0), ('6', 'L', 3000),
('7', 'S', -3000), ('7', 'M', 0), ('7', 'L', 3000),
('8', 'S', -3000), ('8', 'M', 0), ('8', 'L', 3000),

-- Trà sữa
('9', 'S', -5000), ('9', 'M', 0), ('9', 'L', 5000),
('10', 'S', -5000), ('10', 'M', 0), ('10', 'L', 5000),
('11', 'S', -5000), ('11', 'M', 0), ('11', 'L', 5000),

-- Trà trái cây
('12', 'S', -4000), ('12', 'M', 0), ('12', 'L', 4000),
('13', 'S', -4000), ('13', 'M', 0), ('13', 'L', 4000),
('14', 'S', -4000), ('14', 'M', 0), ('14', 'L', 4000),

-- Sữa chua
('15', 'S', -3000), ('15', 'M', 0), ('15', 'L', 3000),
('16', 'S', -3000), ('16', 'M', 0), ('16', 'L', 3000),
('17', 'S', -3000), ('17', 'M', 0), ('17', 'L', 3000);
-- Thêm cột xác nhận chuyển khoản vào bảng orders
ALTER TABLE orders
ADD COLUMN user_confirmed_transfer BOOLEAN DEFAULT FALSE,
ADD COLUMN user_confirmed_transfer_at DATETIME NULL;
ALTER TABLE orders
ADD COLUMN customer_name VARCHAR(100),
ADD COLUMN customer_phone VARCHAR(20);
ALTER TABLE users
ADD COLUMN avatar_url VARCHAR(255) DEFAULT NULL;