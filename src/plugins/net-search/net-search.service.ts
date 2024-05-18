import { Injectable } from '@nestjs/common';
import { ExecutePluginDto } from '../dto/execute-plugin.dto';
import puppeteer from 'puppeteer';

@Injectable()
export class NetSearchService {
  async execute(params: ExecutePluginDto): Promise<string> {
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
  你的任务是根据用户的问题，通过下面的搜索结果提供更精确、详细、具体的回答。回答中，需要在引用处使用 [[序号](链接地址)] 格式标注链接。
  注意回答语言需要与用户提问的语言一致，以下是搜索结果：`;
  return `${instructions}\n${formatStr}`;
}

/**
 * 使用 Puppeteer 在 Bing 中搜索给定查询并抓取前五个搜索结果的链接和内容。
 * @param query 用户的查询字符串
 * @return 返回一个包含搜索结果的对象数组
 */
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
 * 打开链接并获取内容。
 * @param href 链接地址
 * @return 包含链接内容的字符串
 */
async function fetchContent(href: string): Promise<string> {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  let content = '无法获取内容';
  try {
    await page.goto(href, { waitUntil: 'domcontentloaded', timeout: 60000 }); // 设置超时为60秒
    content = await page.evaluate(() => {
      const bodyText = document.body.innerText.trim();
      return bodyText.length > 0 ? bodyText : '无内容';
    });
    content = content.length > 1000 ? content.slice(0, 1000) + '...' : content;
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
  let searchData;
  try {
    let results = await bingSearch(question);
    if (results.length < 3) {
      console.log('Bing搜索结果不足，尝试从Google搜索...');
      const googleResults = await googleSearch(question);
      results = results.concat(googleResults);
    }
    if (results.length < 3) {
      console.log('Google搜索结果不足，尝试从DuckDuckGo搜索...');
      const duckduckgoResults = await duckduckgoSearch(question);
      results = results.concat(duckduckgoResults);
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
