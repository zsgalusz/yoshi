import axios from 'axios';
import { beforeAndAfter, app } from '../environment';

describe('API', () => {
  beforeAndAfter();

  it('should return a valid response', async () => {
    const url = app.getUrl('/');
    const response = await axios.get(url);

    expect(response.data).toEqual({
      success: true,
      payload: 'Hello world!',
    });
  });
});
