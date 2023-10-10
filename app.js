import { PDFLoader } from 'langchain/document_loaders/fs/pdf'
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"



// load documents
const loader = new PDFLoader("./files/Software-Architecture-Patterns.pdf")
const docs = await loader.load()

// document transformers
const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 2000,
    chunkOverlap: 200,
})
const output = await splitter.createDocuments([])

