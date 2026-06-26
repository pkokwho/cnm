import { ExtractedEntity } from "./types";

const SURNAMES = [
  "赵", "钱", "孙", "李", "周", "吴", "郑", "王", "冯", "陈",
  "褚", "卫", "蒋", "沈", "韩", "杨", "朱", "秦", "尤", "许",
  "何", "吕", "施", "张", "孔", "曹", "严", "华", "金", "魏",
  "陶", "姜", "戚", "谢", "邹", "喻", "柏", "水", "窦", "章",
  "云", "苏", "潘", "葛", "奚", "范", "彭", "郎", "鲁", "韦",
  "昌", "马", "苗", "凤", "花", "方", "俞", "任", "袁", "柳",
  "唐", "罗", "薛", "雷", "贺", "倪", "汤", "滕", "殷", "罗",
  "毕", "郝", "邬", "安", "常", "乐", "于", "时", "傅", "皮",
  "卞", "齐", "康", "伍", "余", "元", "卜", "顾", "孟", "黄",
  "穆", "萧", "尹", "姚", "邵", "堪", "汪", "祁", "毛", "禹",
];

const TITLES = ["先生", "女士", "小姐", "总", "经理", "主任", "老师", "教授", "博士", "律师", "医生", "同志"];

const ORG_SUFFIXES = [
  "有限公司", "股份公司", "集团", "公司", "部门", "局", "中心", "银行",
  "医院", "学校", "大学", "研究所", "研究院", "委员会", "办事处", "法院",
  "检察院", "公安局", "街道办事处", "社区", "村委会", "居委会",
];

export function extractEntities(text: string): ExtractedEntity {
  const result: ExtractedEntity = {
    phones: [],
    emails: [],
    amounts: [],
    people: [],
    organizations: [],
  };

  if (!text) return result;

  // Phones: 1[3-9]xxxxxxxxx
  const phoneRe = /1[3-9]\d{9}/g;
  const phoneMatches = text.match(phoneRe);
  if (phoneMatches) {
    result.phones = [...new Set(phoneMatches)];
  }

  // Emails
  const emailRe = /[\w.+-]+@[\w-]+\.[\w.-]+/g;
  const emailMatches = text.match(emailRe);
  if (emailMatches) {
    result.emails = [...new Set(emailMatches)];
  }

  // Amounts: number + currency
  const amountRe = /(\d[\d,]*\.?\d+)\s*(元|块钱?|￥|¥|\$|RMB|人民币|美元|欧元)/gi;
  let match;
  while ((match = amountRe.exec(text)) !== null) {
    const value = parseFloat(match[1].replace(/,/g, ""));
    let currency = "CNY";
    const curLower = match[2].toLowerCase();
    if (curLower === "$" || match[2] === "美元") currency = "USD";
    else if (match[2] === "欧元") currency = "EUR";
    result.amounts.push({ value, currency, raw: match[0] });
  }

  // People: surname + 1-2 char name + optional title
  const surnamePattern = SURNAMES.join("|");
  // Match surname + 1-2 Chinese chars, optionally followed by a title
  const personRe = new RegExp(`(${surnamePattern})([\\u4e00-\\u9fa5]{1,2})(?:(${TITLES.join("|")}))?`, "g");
  const peopleSet = new Set<string>();
  while ((match = personRe.exec(text)) !== null) {
    // Avoid matching common words that start with a surname character
    const name = match[1] + match[2];
    const title = match[3] || "";
    const fullRef = title ? name + title : name;
    // Filter out very common false positives
    if (name.length >= 2 && name.length <= 3) {
      peopleSet.add(fullRef);
    }
  }
  result.people = Array.from(peopleSet).slice(0, 20);

  // Organizations: 2-8 Chinese chars + org suffix
  const orgSuffixPattern = ORG_SUFFIXES.sort((a, b) => b.length - a.length).join("|");
  const orgRe = new RegExp(`([\\u4e00-\\u9fa5]{2,8})(${orgSuffixPattern})`, "g");
  const orgSet = new Set<string>();
  while ((match = orgRe.exec(text)) !== null) {
    orgSet.add(match[0]);
  }
  result.organizations = Array.from(orgSet).slice(0, 20);

  return result;
}
