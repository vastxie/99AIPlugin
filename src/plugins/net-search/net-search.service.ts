import { Injectable } from '@nestjs/common';
import { ExecutePluginDto } from '../dto/execute-plugin.dto';
import puppeteer from 'puppeteer';
import axios from 'axios';
import { cities } from './cities';

@Injectable()
export class NetSearchService {
  private lastCallTime: number | null = null;
  async execute(params: ExecutePluginDto): Promise<string> {
    const currentTime = Date.now();
    if (this.lastCallTime && currentTime - this.lastCallTime < 3000) {
      const waitTime = 3000 - (currentTime - this.lastCallTime);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    this.lastCallTime = Date.now();

    const urlPattern = /(https?:\/\/[^\s]+)/g;
    const urls = params.prompt.match(urlPattern);
    if (urls && urls.length > 0) {
      const results = [];
      for (const url of urls) {
        const content = await fetchContent(url, 5000);
        results.push(`链接: ${url}\n内容: ${content}`);
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
      return results.join('\n\n');
    }
    return compileNetwork(params.prompt);
  }
}

/**
 * 格式化搜索数据，生成结构化的回答。
 * @param searchData 包含搜索结果的对象
 * @param question 用户的查询问题
 * @return 格式化后的回答文本
 */
function formatSearchData(searchData: {
  results: Array<{ href: string; content: string; abstract: string }>;
}): string {
  const formatStr = searchData.results
    .map(
      ({ href, content, abstract }) =>
        `链接: ${href}
        摘要: ${abstract}
        内容: ${content}; `,
    )
    .join('\n\n');
  const instructions = `
  你的任务是根据用户的问题，通过下面的搜索结果提供更精确、详细、具体的回答。
  回答中，需要在引用处使用 [[序号](链接地址)] 格式标注链接，并且在所有回答的最后，列出所有的引用来源。
  注意回答语言需要与用户提问的语言一致，以下是搜索结果：`;
  return `${instructions}\n${formatStr}`;
}

/**
 * 使用 Puppeteer 在 Bing 中搜索给定查询并抓取前五个搜索结果的链接和内容。
 * @param query 用户的查询字符串
 * @return 返回一个包含搜索结果的对象数组
 */

async function baiduSearch(
  query: string,
): Promise<Array<{ href: string; title: string; abstract: string }>> {
  console.log(`开始在Baidu中搜索查询: ${query}`);
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.goto(`https://www.baidu.com/s?wd=${encodeURIComponent(query)}`);
  console.log('已导航到Baidu搜索页面');

  const items = await page.evaluate(() => {
    const liElements = Array.from(
      document.querySelectorAll('#content_left .result.c-container.new-pmd'),
    );
    const n = Math.floor(Math.random() * Math.min(6, liElements.length));
    const slicedElements = liElements.slice(n, n + 2);
    return slicedElements.map((li) => {
      const linkElement = li.querySelector('h3 a');
      const title = linkElement ? linkElement.textContent || '' : '';
      const href = linkElement ? linkElement.getAttribute('href') || '' : '';
      const abstract = li.querySelector('.c-abstract')
        ? li.querySelector('.c-abstract').textContent || ''
        : '';
      return { title, href, abstract };
    });
  });

  await browser.close();
  console.log(`解析到的链接数量：${items.length}`);
  items.forEach((item) => {
    console.log(`标题: ${item.title}`);
    console.log(`链接: ${item.href}`);
    console.log(`摘要: ${item.abstract}`);
  });

  return items;
}

async function bingSearch(
  query: string,
): Promise<Array<{ href: string; title: string; abstract: string }>> {
  console.log(`开始在Bing中搜索查询: ${query}`);
  const bingUrl = process.env.BING_URL || 'https://cn.bing.com';
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.goto(
    `${bingUrl}/search?form=QBRE&q=${encodeURIComponent(query)}&cc=CN`,
  );
  console.log('已导航到Bing搜索页面');

  const items = await page.evaluate(() => {
    const liElements = Array.from(
      document.querySelectorAll('#b_results > .b_algo'),
    );
    const firstFiveLiElements = liElements.slice(0, 5);
    return firstFiveLiElements.map((li) => {
      const abstractElement = li.querySelector('.b_caption > p');
      const linkElement = li.querySelector('a');
      const href = linkElement ? linkElement.getAttribute('href') || '' : '';
      const title = linkElement ? linkElement.textContent || '' : '';
      const abstract = abstractElement ? abstractElement.textContent || '' : '';
      return { href, title, abstract };
    });
  });

  await browser.close();

  console.log(`解析到的链接数量：${items.length}`);
  items.forEach((item) => {
    console.log(`标题: ${item.title}`);
    console.log(`链接: ${item.href}`);
    console.log(`摘要: ${item.abstract}`);
  });

  return items;
}

/**
 * 使用 Puppeteer 在 Google 中搜索给定查询并抓取前五个搜索结果的链接和内容。
 * @param query 用户的查询字符串
 * @return 返回一个包含搜索结果的对象数组
 */
async function googleSearch(
  query: string,
): Promise<Array<{ href: string; title: string; abstract: string }>> {
  console.log(`开始在Google中搜索查询: ${query}`);
  const googleUrl = process.env.GOOGLE_URL || 'https://www.google.com.hk';
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.goto(
    `${googleUrl}/search?q=${encodeURIComponent(query)}&oq=${encodeURIComponent(query)}&uule=w+CAIQICIaQXVzdGluLFRleGFzLFVuaXRlZCBTdGF0ZXM&hl=en&gl=us&sourceid=chrome&ie=UTF-8%22#ip=1`,
  );
  console.log('已导航到Google搜索页面');

  const items = await page.evaluate(() => {
    const liElements = Array.from(
      (document.querySelector('#search > div > div') as Element).childNodes,
    ) as Element[];
    const firstFiveLiElements = liElements.slice(0, 5);
    return firstFiveLiElements.map((li) => {
      const linkElement = li.querySelector('a');
      const href = linkElement ? linkElement.getAttribute('href') || '' : '';
      const title = linkElement
        ? linkElement.querySelector('a > h3')?.textContent || ''
        : '';
      const abstract = Array.from(
        li.querySelectorAll('div > div > div > div > div > div > span'),
      )
        .map((e) => e.textContent || '')
        .join('');
      return { href, title, abstract };
    });
  });

  await browser.close();

  console.log(`解析到的链接数量：${items.length}`);
  items.forEach((item) => {
    console.log(`标题: ${item.title}`);
    console.log(`链接: ${item.href}`);
    console.log(`摘要: ${item.abstract}`);
  });

  return items;
}

/**
 * 使用 Puppeteer 在 DuckDuckGo 中搜索给定查询并抓取前五个搜索结果的链接和内容。
 * @param query 用户的查询字符串
 * @return 返回一个包含搜索结果的对象数组
 */
async function duckduckgoSearch(
  query: string,
): Promise<Array<{ href: string; title: string; abstract: string }>> {
  console.log(`开始在DuckDuckGo中搜索查询: ${query}`);
  const duckduckgoUrl = process.env.DUCKDUCKGO_URL || 'https://duckduckgo.com';
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.goto(
    `${duckduckgoUrl}/?q=${encodeURIComponent(query)}&kl=hk-tzh&ia=web`,
  );
  console.log('已导航到DuckDuckGo搜索页面');

  const items = await page.evaluate(() => {
    const liElements = Array.from(
      document.querySelectorAll('#react-layout ol li'),
    );
    const firstFiveLiElements = liElements.slice(0, 5);
    return firstFiveLiElements.map((li) => {
      const abstractElement = li.querySelector('div:nth-child(3) > div');
      const linkElement = li.querySelector('div:nth-child(2) > a');
      const href = linkElement ? linkElement.getAttribute('href') || '' : '';
      const title = linkElement ? linkElement.textContent || '' : '';
      const abstract = abstractElement ? abstractElement.textContent || '' : '';
      return { href, title, abstract };
    });
  });

  await browser.close();

  console.log(`解析到的链接数量：${items.length}`);
  items.forEach((item) => {
    console.log(`标题: ${item.title}`);
    console.log(`链接: ${item.href}`);
    console.log(`摘要: ${item.abstract}`);
  });

  return items;
}

/**
 * 使用 souGouSearch 中搜索给定页面的内容。
 * @param query 用户的查询字符串
 * @return 返回一个页面抓取的数据
 */
async function souGouSearch(
  query: string,
): Promise<Array<{ href: string; title: string; abstract: string }>> {
  console.log(`开始在souGou中搜索查询: ${query}`);
  const souGouSearchUrl = 'https://www.sogou.com';
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.goto(
    `${souGouSearchUrl}/sogou?pid=sogou-site-7985672db979303a&query=${encodeURIComponent(query)}`,
  );
  console.log('已导航到souGou搜索页面');

  const items = await page.evaluate(() => {
    const liElements = Array.from(
      document.querySelectorAll('#react-layout ol li'),
    );
    const firstFiveLiElements = liElements.slice(0, 5);
    return firstFiveLiElements.map((li) => {
      const abstractElement = li.querySelector('div:nth-child(3) > div');
      const linkElement = li.querySelector('div:nth-child(2) > a');
      const href = linkElement ? linkElement.getAttribute('href') || '' : '';
      const title = linkElement ? linkElement.textContent || '' : '';
      const abstract = abstractElement ? abstractElement.textContent || '' : '';
      return { href, title, abstract };
    });
  });

  await browser.close();

  console.log(`解析到的链接数量：${items.length}`);
  items.forEach((item) => {
    console.log(`标题: ${item.title}`);
    console.log(`链接: ${item.href}`);
    console.log(`摘要: ${item.abstract}`);
  });

  return items;
}

/**
 * 打开链接并获取内容。
 * @param href 链接地址
 * @param contentLimit 可选的内容上限，默认为1000
 * @return 包含链接内容的字符串
 */
async function fetchContent(
  href: string,
  contentLimit: number = 1000,
): Promise<string> {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  let content = '无法获取内容';
  try {
    await page.goto(href, { waitUntil: 'domcontentloaded', timeout: 60000 }); // 设置超时为60秒
    await page.waitForSelector('body');
    content = await page.evaluate(() => {
      const bodyText = document.body.innerText.trim();
      return bodyText.length > 0 ? bodyText : '无内容';
    });
    content =
      content.length > contentLimit
        ? content.slice(0, contentLimit) + '...'
        : content;
  } catch (error) {
    console.error(`访问链接 ${href} 失败，使用默认内容：${error}`);
  } finally {
    await page.close();
    await browser.close();
  }
  return content;
}

/**
 * 编译网络请求，处理用户问题，并返回格式化的搜索结果。
 * @param question 用户的查询问题
 * @return 格式化的搜索结果或原始问题
 */
export async function compileNetwork(question: string): Promise<string> {
  console.log(`开始对问题“${question}”进行网络搜索`);
  const enableQuickSearch = process.env.ENABLE_QUICK_SEARCH === 'true';
  console.log(`快速搜索功能是否启用：${enableQuickSearch}`);

  // 从环境变量中读取搜索引擎顺序
  const searchEngines = process.env.SEARCH_ENGINES
    ? process.env.SEARCH_ENGINES.split(',')
    : ['bing', 'baidu', 'sougou', 'duckduckgo', 'google'];

  let searchData;
  try {
    // 检查是否是天气搜索
    try {
      const weatherResults = await textjson(question);
      if (weatherResults) {
        console.log('检测到天气搜索...');
        const weatherSearchResults = await weatherSearch(weatherResults);
        const instructions = `
        你的任务是根据用户的问题，通过下面的搜索结果提供更精确、详细、具体的回答。回答中，
        注意回答语言需要与用户提问的语言一致，以下是搜索结果：`;
        const finalInstructions = `${instructions}\n${weatherSearchResults}`;
        return finalInstructions;
      }
    } catch (error) {
      /* empty */
    }

    let results = [];
    // 按顺序尝试不同的搜索引擎
    for (const engine of searchEngines) {
      if (results.length >= 3) break; // 如果已有足够多的结果，则停止尝试

      console.log(`尝试从${engine}搜索...`);
      let engineResults = [];
      switch (engine) {
        case 'bing':
          engineResults = await bingSearch(question);
          break;
        case 'baidu':
          engineResults = await baiduSearch(question);
          break;
        case 'sougou':
          engineResults = await souGouSearch(question);
          break;
        case 'duckduckgo':
          engineResults = await duckduckgoSearch(question);
          break;
        case 'google':
          engineResults = await googleSearch(question);
          break;
        default:
          console.warn(`未知的搜索引擎：${engine}`);
      }
      results = results.concat(engineResults);
    }

    if (enableQuickSearch) {
      searchData = {
        results: results.map((item) => ({
          ...item,
          content: '',
        })),
      };
    } else {
      searchData = {
        results: await Promise.all(
          results.map(async (item) => {
            const content = await fetchContent(item.href);
            return { ...item, content };
          }),
        ),
      };
    }

    console.log(
      `已成功接收到“${question}”的搜索结果，结果数量为：${searchData.results.length}`,
    );
  } catch (error) {
    console.error(`处理问题“${question}”时出现错误：`, error);
    return question;
  }

  if (searchData.results.length === 0) {
    console.log(`未找到问题“${question}”的搜索结果，将返回原问题`);
    return question;
  } else {
    const formattedData = formatSearchData(searchData);
    return formattedData;
  }
}

function textjson(targetStr: string): string {
  if (!targetStr.includes('天气')) {
    return null;
  }
  function findKeyValue(
    arr: Array<{ [key: string]: string }>,
    targetStr: string,
  ): { key: string; value: string } | null {
    for (const obj of arr) {
      const key = Object.keys(obj)[0];
      if (targetStr.includes(key)) {
        return { key, value: obj[key] };
      }
    }
    return null;
  }

  const result = findKeyValue(cities, targetStr);
  if (result) {
    // console.log(`字符串包含key: ${result.key}, 对应的value是: ${result.value}`);
    return result.value;
  } else {
    // console.log("字符串不包含任何key");
    return null;
  }
}

/**
 * 每次请求间隔必须3秒一次，如果多次超过3秒内调用多次，会封掉IP段
 * 每分钟阈值为300次，如果超过会禁用3600秒。请谨慎使用
 * 使用 天气搜索。
 * @param query 用户的查询字符串
 * @return 返回天气搜索的数据
 */
async function weatherSearch(
  query: string,
): Promise<Array<{ href: string; title: string; abstract: string }>> {
  console.log(`开始天气搜索查询: ${query}`);
  const baseSearchUrl = 'http://t.weather.itboy.net';
  try {
    const response = await axios.get(
      `${baseSearchUrl}/api/weather/city/${query}`,
    );
    const jsonResponse = response.data;

    if (!jsonResponse.data || !jsonResponse.data.forecast) {
      throw new Error('Invalid response format');
    }

    const forecast = jsonResponse.data.forecast;
    const parsedForecasts = forecast
      .map((item) => {
        return (
          `日期: ${item.date}, 高温: ${item.high}, 低温: ${item.low}, ` +
          `日期: ${item.ymd}, 星期: ${item.week}, 日出: ${item.sunrise}, ` +
          `日落: ${item.sunset}, 空气质量指数: ${item.aqi}, 风向: ${item.fx}, ` +
          `风力: ${item.fl}, 天气类型: ${item.type}, 提示: ${item.notice}`
        );
      })
      .join(' ');

    return parsedForecasts;
  } catch (error) {
    console.error('Error fetching weather data:', error);
  }
}
