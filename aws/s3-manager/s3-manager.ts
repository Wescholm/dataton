import AWS, { S3 } from 'aws-sdk';
import { DeleteObjectOutput, GetObjectRequest } from "aws-sdk/clients/s3";
import { ManagedUpload } from "aws-sdk/lib/s3/managed_upload";

export class S3Manager {
    private readonly s3: S3;

    constructor(region: string) {
        this.s3 = new AWS.S3({ region });
    }

    public async put(bucket: string, key: string, file: Buffer): Promise<ManagedUpload.SendData> {
        return await this.s3.upload({
            Bucket: bucket,
            Key: key,
            Body: file
        }).promise();
    }

    public async get(bucket: string, key: string): Promise<Buffer> {
        const params: GetObjectRequest = {
            Bucket: bucket,
            Key: key
        };
        return new Promise((resolve, reject) => {
            this.s3.getObject(params, (err, data) => {
                return err ? reject(err) : resolve(data.Body as Buffer);
            });
        });
    }

    public async delete(bucket: string, key: string): Promise<DeleteObjectOutput> {
        return await this.s3.deleteObject({
            Bucket: bucket,
            Key: key
        }).promise();
    }
}
