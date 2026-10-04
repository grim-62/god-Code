require('./config/env')

const mongoose = require('mongoose')
const User = require('./models/User')
const Problem = require('./models/Problem')
const Exam = require('./models/Exam')
const Submission = require('./models/Submission')

const ids = {
  problems: [
    new mongoose.Types.ObjectId('670000000000000000000001'),
    new mongoose.Types.ObjectId('670000000000000000000002'),
    new mongoose.Types.ObjectId('670000000000000000000003'),
    new mongoose.Types.ObjectId('670000000000000000000004'),
  ],
  exams: [
    new mongoose.Types.ObjectId('680000000000000000000001'),
    new mongoose.Types.ObjectId('680000000000000000000002'),
    new mongoose.Types.ObjectId('680000000000000000000003'),
  ],
  submissions: [
    new mongoose.Types.ObjectId('690000000000000000000001'),
    new mongoose.Types.ObjectId('690000000000000000000002'),
    new mongoose.Types.ObjectId('690000000000000000000003'),
    new mongoose.Types.ObjectId('690000000000000000000004'),
  ],
}

function sampleProblems(userId) {
  const [sumId, palindromeId, maxId, fizzBuzzId] = ids.problems

  return [
    {
      _id: sumId,
      title: 'Sum of Two Numbers',
      slug: 'sum-of-two-numbers',
      difficulty: 'Easy',
      tags: ['Math', 'Warmup'],
      description: 'Read two integers and print their sum.',
      constraints: '-10^9 <= a, b <= 10^9',
      examples: [{ input: '4 7', output: '11', explanation: '4 + 7 = 11.' }],
      starterCode: {
        python: 'a, b = map(int, input().split())\nprint(a + b)',
        javascript: "const fs = require('fs');\nconst [a, b] = fs.readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconsole.log(a + b);",
      },
      driverCode: { python: '{{USER_CODE}}', javascript: '{{USER_CODE}}' },
      testCases: [
        { input: '4 7', expectedOutput: '11', isHidden: false },
        { input: '-3 9', expectedOutput: '6', isHidden: false },
        { input: '1000000000 1000000000', expectedOutput: '2000000000', isHidden: true },
      ],
      timeLimit: 1000,
      memoryLimit: 128,
      createdBy: userId,
    },
    {
      _id: palindromeId,
      title: 'Palindrome Check',
      slug: 'palindrome-check',
      difficulty: 'Easy',
      tags: ['String', 'Two Pointers'],
      description: 'Print `true` if the given word reads the same forward and backward; otherwise print `false`.',
      constraints: '1 <= length of word <= 100000',
      examples: [{ input: 'level', output: 'true', explanation: 'The word is identical when reversed.' }],
      starterCode: {
        python: "word = input().strip()\nprint(str(word == word[::-1]).lower())",
        javascript: "const fs = require('fs');\nconst word = fs.readFileSync(0, 'utf8').trim();\nconsole.log(String(word === [...word].reverse().join('')));",
      },
      driverCode: { python: '{{USER_CODE}}', javascript: '{{USER_CODE}}' },
      testCases: [
        { input: 'level', expectedOutput: 'true', isHidden: false },
        { input: 'coding', expectedOutput: 'false', isHidden: false },
        { input: 'a', expectedOutput: 'true', isHidden: true },
      ],
      timeLimit: 1000,
      memoryLimit: 128,
      createdBy: userId,
    },
    {
      _id: maxId,
      title: 'Largest of Three',
      slug: 'largest-of-three',
      difficulty: 'Medium',
      tags: ['Array', 'Math'],
      description: 'Read three integers and print the largest value.',
      constraints: 'Values fit in a signed 32-bit integer.',
      examples: [{ input: '8 3 12', output: '12', explanation: '12 is the greatest input.' }],
      starterCode: {
        python: 'values = list(map(int, input().split()))\nprint(max(values))',
        javascript: "const fs = require('fs');\nconst values = fs.readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconsole.log(Math.max(...values));",
      },
      driverCode: { python: '{{USER_CODE}}', javascript: '{{USER_CODE}}' },
      testCases: [
        { input: '8 3 12', expectedOutput: '12', isHidden: false },
        { input: '-4 -1 -9', expectedOutput: '-1', isHidden: false },
        { input: '5 5 5', expectedOutput: '5', isHidden: true },
      ],
      timeLimit: 1000,
      memoryLimit: 128,
      createdBy: userId,
    },
    {
      _id: fizzBuzzId,
      title: 'Fizz Buzz',
      slug: 'fizz-buzz',
      difficulty: 'Easy',
      tags: ['Math', 'Simulation'],
      description: 'For each integer from 1 through `n`, print `FizzBuzz` for multiples of both 3 and 5, `Fizz` for multiples of 3, `Buzz` for multiples of 5, and the number otherwise.',
      constraints: '1 <= n <= 10000',
      examples: [{ input: '5', output: `1
    2
    Fizz
    4
    Buzz`, explanation: 'Print one result per line.' }],
      starterCode: {
        python: "n = int(input())\nfor value in range(1, n + 1):\n    if value % 15 == 0:\n        print('FizzBuzz')\n    elif value % 3 == 0:\n        print('Fizz')\n    elif value % 5 == 0:\n        print('Buzz')\n    else:\n        print(value)",
        javascript: "const fs = require('fs');\nconst n = Number(fs.readFileSync(0, 'utf8').trim());\nfor (let value = 1; value <= n; value += 1) {\n  console.log(value % 15 === 0 ? 'FizzBuzz' : value % 3 === 0 ? 'Fizz' : value % 5 === 0 ? 'Buzz' : value);\n}",
      },
      driverCode: { python: '{{USER_CODE}}', javascript: '{{USER_CODE}}' },
      testCases: [
        { input: '5', expectedOutput: '1\n2\nFizz\n4\nBuzz', isHidden: false },
        { input: '15', expectedOutput: '1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz', isHidden: true },
      ],
      timeLimit: 1000,
      memoryLimit: 128,
      createdBy: userId,
    },
  ]
}

function sampleExams(userId, now) {
  const [sumId, palindromeId, maxId] = ids.problems
  const [liveId, upcomingId, pastId] = ids.exams
  const hour = 60 * 60 * 1000
  const minute = 60 * 1000

  return [
    {
      _id: liveId,
      title: 'Live Warmup Contest',
      problems: [{ problem: sumId, marks: 100 }, { problem: palindromeId, marks: 150 }],
      startTime: new Date(now - 15 * minute),
      endTime: new Date(now + 45 * minute),
      duration: 60,
      createdBy: userId,
      createdAt: now,
      participants: [],
    },
    {
      _id: upcomingId,
      title: 'Weekend Algorithms Cup',
      problems: [{ problem: palindromeId, marks: 100 }, { problem: maxId, marks: 200 }],
      startTime: new Date(now + 24 * hour),
      endTime: new Date(now + 26 * hour),
      duration: 90,
      createdBy: userId,
      createdAt: now,
      participants: [],
    },
    {
      _id: pastId,
      title: 'Past Practice Sprint',
      problems: [{ problem: sumId, marks: 100 }, { problem: maxId, marks: 200 }],
      startTime: new Date(now - 3 * hour),
      endTime: new Date(now - 2 * hour),
      duration: 60,
      createdBy: userId,
      createdAt: now,
      participants: [{
        user: userId,
        startedAt: new Date(now - 3 * hour),
        endsAt: new Date(now - 2 * hour),
        violations: [],
      }],
    },
  ]
}

function sampleSubmissions(userId, now) {
  const [sumId, palindromeId, maxId] = ids.problems
  const [, , pastExamId] = ids.exams
  const day = 24 * 60 * 60 * 1000
  const hour = 60 * 60 * 1000

  return [
    {
      _id: ids.submissions[0], user: userId, problem: sumId, language: 'python', code: 'a, b = map(int, input().split())\nprint(a + b)',
      verdict: 'Accepted', runtimeMs: 18, memoryKb: 9216, passed: 3, total: 3, createdAt: new Date(now - 2 * day),
    },
    {
      _id: ids.submissions[1], user: userId, problem: palindromeId, language: 'javascript', code: "const fs = require('fs');\nconst word = fs.readFileSync(0, 'utf8').trim();\nconsole.log(String(word === [...word].reverse().join('')));",
      verdict: 'Accepted', runtimeMs: 24, memoryKb: 11800, passed: 3, total: 3, createdAt: new Date(now - day),
    },
    {
      _id: ids.submissions[2], user: userId, problem: maxId, exam: pastExamId, language: 'python', code: 'values = list(map(int, input().split()))\nprint(max(values))',
      verdict: 'Accepted', runtimeMs: 20, memoryKb: 9600, passed: 3, total: 3, createdAt: new Date(now - 3 * hour),
    },
    {
      _id: ids.submissions[3], user: userId, problem: maxId, language: 'python', code: 'print(0)',
      verdict: 'Wrong Answer', runtimeMs: 16, memoryKb: 9100, passed: 0, total: 3,
      failedCase: { input: '8 3 12', expected: '12', actual: '0' }, createdAt: new Date(now - 4 * hour),
    },
  ]
}

async function upsertMany(model, documents) {
  await model.collection.bulkWrite(documents.map((document) => {
    const { _id, ...fields } = document
    return {
      updateOne: {
        filter: { _id },
        update: { $set: fields, $setOnInsert: { _id } },
        upsert: true,
      },
    }
  }))
}

async function seed() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not set.')
    // const url  ='mongodb://2pdgrim_db_user:LfZ51MskexzphlOb@ac-sozdhf1-shard-00-00.8hnpxog.mongodb.net:27017,ac-sozdhf1-shard-00-01.8hnpxog.mongodb.net:27017,ac-sozdhf1-shard-00-02.8hnpxog.mongodb.net:27017/?ssl=true&replicaSet=atlas-njflc0-shard-0&authSource=admin&appName=Cluster0'
  await mongoose.connect(url)

  let user
  if (process.env.SEED_USER_ID) {
    if (!mongoose.isValidObjectId(process.env.SEED_USER_ID)) throw new Error('SEED_USER_ID must be a valid MongoDB ObjectId.')
    user = await User.findById(process.env.SEED_USER_ID)
  } else {
    user = await User.findOne().sort({ createdAt: 1 })
  }

  if (!user) {
    throw new Error('No existing user found. Register an account first or set SEED_USER_ID. The seed script does not create users.')
  }

  const now = new Date()
  const userId = user._id
  await upsertMany(Problem, sampleProblems(userId))
  await upsertMany(Exam, sampleExams(userId, now))
  await upsertMany(Submission, sampleSubmissions(userId, now))

  console.log(`Seeded 4 problems, 3 exams, and 4 submissions for existing user ${user.email}.`)
  console.log('No user records were created or modified.')
}

seed()
  .catch((error) => {
    console.error('Seed failed:', error.message)
    process.exitCode = 1
  })
  .finally(async () => {
    await mongoose.disconnect()
  })