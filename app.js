import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { HNSWLib } from "langchain/vectorstores/hnswlib";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { StringOutputParser } from "langchain/schema/output_parser";
// import { BufferMemory } from "langchain/memory";
// import { RedisChatMessageHistory } from "langchain/stores/message/ioredis";
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  PromptTemplate,
  SystemMessagePromptTemplate,
} from "langchain/prompts";

import { ChatOpenAI } from "langchain/chat_models/openai";
import {
    RunnablePassthrough,
    RunnableSequence,
  } from "langchain/schema/runnable";
import * as dotenv from "dotenv";
import * as readline from 'readline'

import { SYSTEM_TEMPLATE } from "./src/prompts/index.js";
import { getInput } from './src/utils/index.js'

// load env variables
dotenv.config();
console.log(process.env)

const {
  AZURE_OPEN_AI_BASE_PATH,
  AZURE_OPEN_AI_API_VERSION,
  AZURE_OPEN_AI_API_CHAT_DEPLOYMENT_NAME,
  AZURE_OPEN_AI_API_COMPLETION_DEPLOYMENT_NAME,
  AZURE_OPEN_AI_API_EMBEDDING_DEPLOYMENT_NAME,
  AZURE_OPEN_AI_API_KEY,
} = process.env;

// const memory = new BufferMemory({
//     chatHistory: new RedisChatMessageHistory({
//       sessionId: new Date().toISOString(), // Or some other unique identifier for the conversation
//       sessionTTL: 300, // 5 minutes, omit this parameter to make sessions never expire
//       url: "redis://localhost:6379", // Default value, override with your own instance's URL
//     }),
//   });
const model = new ChatOpenAI({
  azureOpenAIApiDeploymentName: AZURE_OPEN_AI_API_CHAT_DEPLOYMENT_NAME,
  azureOpenAIApiKey: AZURE_OPEN_AI_API_KEY,
  azureOpenAIApiVersion: AZURE_OPEN_AI_API_VERSION,
  azureOpenAIBasePath: AZURE_OPEN_AI_BASE_PATH,
  temperature: 0,
});

const embeddings = new OpenAIEmbeddings({
  azureOpenAIApiDeploymentName: AZURE_OPEN_AI_API_EMBEDDING_DEPLOYMENT_NAME,
  azureOpenAIApiKey: AZURE_OPEN_AI_API_KEY,
  azureOpenAIApiVersion: AZURE_OPEN_AI_API_VERSION,
  azureOpenAIBasePath: AZURE_OPEN_AI_BASE_PATH,
  temperature: 0,
});

// load documents
const loader = new PDFLoader("./files/Software-Architecture-Patterns.pdf");
const docs = await loader.load();
const text = docs.reduce((acc, doc) => {
  acc = acc + doc.pageContent + " ";
  return acc;
}, "");
// document transformers
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
});
const output_docs = await splitter.createDocuments([text]);

const serializedDocs = (docs) =>
  docs.map((doc) => doc.pageContent).join("\n\n");

// Create a vector store from the documents.
const vectorStore = await HNSWLib.fromDocuments(output_docs, embeddings);

// Initialize a retriever wrapper around the vector store
const vectorStoreRetriever = vectorStore.asRetriever();

const messages = [
  SystemMessagePromptTemplate.fromTemplate(SYSTEM_TEMPLATE),
  HumanMessagePromptTemplate.fromTemplate("{question}"),
];

const prompt = ChatPromptTemplate.fromMessages(messages);

const chain = RunnableSequence.from([
  {
    context: vectorStoreRetriever.pipe(serializedDocs),
    question: new RunnablePassthrough(),
  },
  prompt,
  model,
  new StringOutputParser(),
]);
  
getInput(async (input) => {
    if(input.trim()){
        const answer = await chain.invoke(
            input
          );
        console.log(answer)
    }
})