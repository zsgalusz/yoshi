import React from 'react';
import { mount, ReactWrapper } from 'enzyme';
import Intro from './TemplateIntro';

describe('Intro', () => {
  let wrapper: ReactWrapper<{}, {}, React.Component<{}, {}>>;

  afterEach(() => wrapper.unmount());

  it('renders a title correctly', () => {
    wrapper = mount(<Intro />);

    expect(wrapper.find('[data-id="egg"]')).toHaveLength(1);
  });
});
