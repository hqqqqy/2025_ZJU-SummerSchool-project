const fs = require('fs');
const path = require('path');

// 用户角色
const roles = ['inactive', 'information-seeker', 'information-source', 'general'];

// 兴趣分类
const interests = [
  'animals', 'arts and culture', 'business and finance', 'entertainment',
  'fashion and beauty', 'fitness and health', 'food and dining', 'learning and educational',
  'politics', 'science and technology', 'sports', 'travel'
];

// 中国城市
const cities = [
  '北京', '上海', '广州', '深圳', '杭州', '南京', '成都', '武汉', '西安', '重庆',
  '天津', '苏州', '青岛', '大连', '长沙', '宁波', '佛山', '无锡', '合肥', '昆明',
  '沈阳', '哈尔滨', '长春', '石家庄', '济南', '郑州', '太原', '南昌', '福州', '厦门'
];

// 生成随机日期
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// 生成随机整数
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 生成随机兴趣组合
function generateInterests() {
  const numInterests = randomInt(1, 3);
  const selectedInterests = [];
  const shuffled = [...interests].sort(() => 0.5 - Math.random());
  
  for (let i = 0; i < numInterests; i++) {
    selectedInterests.push(shuffled[i]);
  }
  
  return selectedInterests.join(',');
}

// 生成用户数据
function generateUserData() {
  const users = [];
  
  for (let i = 1; i <= 500; i++) {
    const userId = `user_${String(i).padStart(3, '0')}`;
    const role = roles[randomInt(0, roles.length - 1)];
    const userInterests = generateInterests();
    const registrationDate = randomDate(new Date('2020-01-01'), new Date('2024-01-01')).toISOString().split('T')[0];
    const location = cities[randomInt(0, cities.length - 1)];
    
    // 根据角色调整分数范围
    let activityScore, influenceScore, postCount, interactionCount, followerCount, followingCount;
    
    switch (role) {
      case 'inactive':
        activityScore = randomInt(5, 25);
        influenceScore = randomInt(3, 20);
        postCount = randomInt(0, 20);
        interactionCount = randomInt(0, 100);
        followerCount = randomInt(10, 200);
        followingCount = randomInt(5, 100);
        break;
      case 'information-seeker':
        activityScore = randomInt(25, 60);
        influenceScore = randomInt(15, 45);
        postCount = randomInt(10, 80);
        interactionCount = randomInt(100, 800);
        followerCount = randomInt(100, 1000);
        followingCount = randomInt(200, 600);
        break;
      case 'general':
        activityScore = randomInt(40, 75);
        influenceScore = randomInt(30, 65);
        postCount = randomInt(50, 150);
        interactionCount = randomInt(500, 1500);
        followerCount = randomInt(500, 3000);
        followingCount = randomInt(100, 300);
        break;
      case 'information-source':
        activityScore = randomInt(65, 95);
        influenceScore = randomInt(60, 95);
        postCount = randomInt(100, 500);
        interactionCount = randomInt(1000, 5000);
        followerCount = randomInt(2000, 10000);
        followingCount = randomInt(50, 250);
        break;
    }
    
    const lastActiveDate = randomDate(new Date('2023-11-01'), new Date('2024-01-20')).toISOString().split('T')[0];
    
    users.push({
      userId,
      role,
      interests: `"${userInterests}"`,
      registrationDate,
      location,
      activityScore,
      influenceScore,
      postCount,
      interactionCount,
      followerCount,
      followingCount,
      lastActiveDate
    });
  }
  
  return users;
}

// 生成时间序列数据 (最近7天，每小时一条数据，用于热力图)
function generateTimeSeriesData() {
  const timeSeries = [];
  const endDate = new Date('2024-01-20T23:00:00.000Z');
  
  // 生成7天 × 24小时 = 168个数据点
  for (let day = 6; day >= 0; day--) {
    for (let hour = 0; hour < 24; hour++) {
      const date = new Date(endDate);
      date.setDate(date.getDate() - day);
      date.setHours(hour, 0, 0, 0);
      
      const timestamp = date.toISOString();
      const dayOfWeek = date.getDay(); // 0=周日, 1=周一, ...
      
      // 基于时间段生成更真实的活跃度模式
      let baseActivity = 100;
      
      // 工作日 vs 周末
      if (dayOfWeek >= 1 && dayOfWeek <= 5) { // 工作日
        if (hour >= 8 && hour <= 10) baseActivity += 150; // 上班通勤
        if (hour >= 12 && hour <= 14) baseActivity += 100; // 午休
        if (hour >= 18 && hour <= 22) baseActivity += 200; // 下班后
        if (hour >= 0 && hour <= 6) baseActivity *= 0.3; // 深夜
      } else { // 周末
        if (hour >= 10 && hour <= 12) baseActivity += 80; // 上午
        if (hour >= 14 && hour <= 16) baseActivity += 60; // 下午
        if (hour >= 19 && hour <= 23) baseActivity += 150; // 晚上
        if (hour >= 0 && hour <= 7) baseActivity *= 0.4; // 深夜
      }
      
      // 添加随机波动
      const variance = Math.random() * 100 - 50;
      const activeUserCount = Math.max(50, Math.floor(baseActivity + variance));
      const newUserCount = randomInt(2, 15);
      const postCount = Math.floor(activeUserCount * (2 + Math.random() * 3));
      const interactionCount = Math.floor(postCount * (3 + Math.random() * 7));
      const avgActivityScore = Math.min(100, Math.max(10, baseActivity / 5 + Math.random() * 20));
      const avgInfluenceScore = Math.min(100, Math.max(5, baseActivity / 6 + Math.random() * 25));
      
      timeSeries.push({
        timestamp,
        activeUserCount,
        newUserCount,
        postCount,
        interactionCount,
        avgActivityScore: avgActivityScore.toFixed(1),
        avgInfluenceScore: avgInfluenceScore.toFixed(1)
      });
    }
  }
  
  return timeSeries;
}

// 转换为CSV格式
function arrayToCSV(data) {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      return typeof value === 'string' && value.includes(',') ? value : value;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

// 生成数据并保存
console.log('开始生成500个测试用户数据...');
const userData = generateUserData();
const userCSV = arrayToCSV(userData);

console.log('开始生成时间序列数据...');
const timeSeriesData = generateTimeSeriesData();
const timeSeriesCSV = arrayToCSV(timeSeriesData);

// 确保目录存在
const dataDir = path.join(__dirname, 'src', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 保存用户数据
fs.writeFileSync(path.join(dataDir, 'sample-data.csv'), userCSV, 'utf8');
console.log(`已生成 ${userData.length} 个用户数据，保存至 src/data/sample-data.csv`);

// 保存时间序列数据
fs.writeFileSync(path.join(dataDir, 'sample-timeseries.csv'), timeSeriesCSV, 'utf8');
console.log(`已生成 ${timeSeriesData.length} 条时间序列数据，保存至 src/data/sample-timeseries.csv`);

// 同时保存到public目录，供开发服务器访问
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'sample-data.csv'), userCSV, 'utf8');
fs.writeFileSync(path.join(publicDir, 'sample-timeseries.csv'), timeSeriesCSV, 'utf8');
console.log('数据文件已同步到public目录');

console.log('测试数据生成完成！'); 