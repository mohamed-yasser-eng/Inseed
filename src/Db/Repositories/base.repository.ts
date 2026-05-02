import mongoose, { FilterQuery, Model, ProjectionType, QueryOptions, UpdateQuery } from 'mongoose'

export abstract class BaseRepository<T> {
  constructor(protected model: Model<T>) {}

  async createNewDocument(document: Partial<T>): Promise<T> {
    return await this.model.create(document)
  }

  async findOneDocument(filters: FilterQuery<T>, projection?: ProjectionType<T>, options?: QueryOptions<T>): Promise<T | null> {
    return await this.model.findOne(filters, projection, options)
  }

  async findDocumentById(id: mongoose.Schema.Types.ObjectId, projection?: ProjectionType<T>, options?: QueryOptions<T>): Promise<T | null> {
    return await this.model.findById(id, projection, options)
  }

  async findDocuments(filters: FilterQuery<T>, projection?: ProjectionType<T>, options?: QueryOptions<T>): Promise<T[]> {
    return await this.model.find(filters, projection, options)
  }

  async deleteByIdDocument(id: mongoose.Schema.Types.ObjectId) {
    return await this.model.findByIdAndDelete(id)
  }

  
  async updateDocumentById(filters: FilterQuery<T>, updatedObject?: UpdateQuery<T>, options?: QueryOptions<T>){
    return await this.model.findOneAndUpdate(filters, updatedObject, options)
  }
}
